import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CATEGORY_META, DIFFICULTY_META } from '@shared/constants/question-meta.constants';
import { Achievement } from '@shared/models/achievement.model';
import { SessionScoringSummary } from '@shared/models/game-session.model';
import { Question, QuestionCategory } from '@shared/models/question.model';
import { NotificationService } from '@core/services/notification.service';
import { QuizFacade } from '../data-access/quiz.facade';
import { QuizSetupComponent } from './quiz-setup/quiz-setup.component';
import { QuizResultComponent } from './quiz-result/quiz-result.component';

type GameState = 'setup' | 'playing' | 'feedback' | 'finished';
const QUESTION_TIME_SECONDS = 20;

@Component({
  selector: 'app-quiz',
  standalone: true,
  imports: [CommonModule, QuizSetupComponent, QuizResultComponent],
  templateUrl: './quiz.component.html',
  styleUrls: ['./quiz.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuizComponent implements OnInit, OnDestroy {
  private readonly quizFacade = inject(QuizFacade);
  private readonly notifications = inject(NotificationService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  letters = ['A', 'B', 'C', 'D'] as const;

  state = signal<GameState>('setup');
  selectedCategory = signal<QuestionCategory | null>(null);
  questions = signal<Question[]>([]);
  currentIndex = signal(0);
  selectedAnswer = signal<number | null>(null);
  lastCorrect = signal(false);
  lastPoints = signal(0);
  revealedCorrectOptionIndex = signal<number | null>(null);
  answerSubmitting = signal(false);
  sessionPoints = signal(0);
  correctCount = signal(0);
  streak = signal(0);
  timeLeft = signal(QUESTION_TIME_SECONDS);
  sessionId = signal<string | null>(null);
  sessionStartedAt = signal(0);
  unlockedAchievements = signal<Achievement[]>([]);
  finalScoring = signal<SessionScoringSummary | null>(null);

  private timerInterval: ReturnType<typeof setInterval> | null = null;

  currentQuestion = computed(() => this.questions()[this.currentIndex()]);
  progressPercent = computed(() => {
    const total = this.questions().length;
    return total ? (this.currentIndex() / total) * 100 : 0;
  });
  isLastQuestion = computed(() => this.currentIndex() === this.questions().length - 1);
  accuracy = computed(() =>
    this.questions().length
      ? Math.round((this.correctCount() / this.questions().length) * 100)
      : 0,
  );

  ngOnInit() {
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const rawCategory = params['category'];
      this.selectedCategory.set(this.isQuestionCategory(rawCategory) ? rawCategory : null);
    });
  }

  ngOnDestroy() {
    this.clearTimer();
  }

  startQuiz() {
    this.quizFacade
      .startSession(this.selectedCategory() ?? undefined)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.sessionId.set(res.session.id);
        this.questions.set(res.questions);
        this.currentIndex.set(0);
        this.sessionPoints.set(0);
        this.correctCount.set(0);
        this.streak.set(0);
        this.revealedCorrectOptionIndex.set(null);
        this.answerSubmitting.set(false);
        this.sessionStartedAt.set(Date.now());
        this.unlockedAchievements.set([]);
        this.finalScoring.set(null);
        this.state.set('playing');
        this.startTimer();
      });
  }

  selectAnswer(index: number, q: Question) {
    if (this.state() !== 'playing' || this.answerSubmitting()) return;
    this.clearTimer();

    const timeSpent = QUESTION_TIME_SECONDS - this.timeLeft();
    const sessionId = this.sessionId();
    if (!sessionId) return;

    this.answerSubmitting.set(true);
    this.selectedAnswer.set(index >= 0 ? index : null);

    this.quizFacade
      .submitAnswer(sessionId, q.id, index, timeSpent)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.lastCorrect.set(result.correct);
          this.lastPoints.set(result.pointsEarned);
          this.revealedCorrectOptionIndex.set(result.correctOptionIndex);
          this.sessionPoints.set(result.totalPoints);
          this.selectedAnswer.set(
            result.selectedOptionIndex >= 0 ? result.selectedOptionIndex : null,
          );
          if (result.correct) {
            this.correctCount.update((c) => c + 1);
            this.streak.update((s) => s + 1);
          } else {
            this.streak.set(0);
          }
          this.state.set('feedback');
          this.answerSubmitting.set(false);
        },
        error: () => {
          this.answerSubmitting.set(false);
          this.selectedAnswer.set(null);
          this.startTimer();
        },
      });
  }

  nextQuestion() {
    if (this.answerSubmitting()) return;
    if (this.isLastQuestion()) {
      this.finishSession();
      return;
    }
    this.currentIndex.update((i) => i + 1);
    this.selectedAnswer.set(null);
    this.revealedCorrectOptionIndex.set(null);
    this.state.set('playing');
    this.startTimer();
  }

  restart() {
    this.state.set('setup');
    this.questions.set([]);
    this.currentIndex.set(0);
    this.sessionId.set(null);
    this.sessionStartedAt.set(0);
    this.selectedAnswer.set(null);
    this.lastCorrect.set(false);
    this.lastPoints.set(0);
    this.revealedCorrectOptionIndex.set(null);
    this.answerSubmitting.set(false);
    this.unlockedAchievements.set([]);
    this.finalScoring.set(null);
    this.clearTimer();
  }

  getCatLabel(cat: string): string {
    return CATEGORY_META[cat as QuestionCategory]?.label || cat;
  }

  getDiffLabel(diff: string): string {
    return DIFFICULTY_META[diff as keyof typeof DIFFICULTY_META]?.label || diff;
  }

  getDiffColor(diff: string): string {
    return DIFFICULTY_META[diff as keyof typeof DIFFICULTY_META]?.color || '#000';
  }

  getResultTitle(): string {
    const acc = this.accuracy();
    if (acc >= 90) return 'Resultado excelente';
    if (acc >= 70) return 'Muy buen resultado';
    if (acc >= 50) return 'Buen progreso';
    return 'Seguimos entrenando';
  }

  private finishSession() {
    this.clearTimer();
    const totalTime = this.sessionStartedAt()
      ? Math.round((Date.now() - this.sessionStartedAt()) / 1000)
      : 0;
    const sessionId = this.sessionId();
    if (sessionId) {
      this.quizFacade
        .completeSession(sessionId, totalTime)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((result) => {
          this.unlockedAchievements.set(result.achievements);
          this.finalScoring.set(result.scoring ?? null);
          const awarded = result.scoring?.awardedPoints ?? 0;
          if (result.scoring?.dailyCapApplied) {
            this.notifications.info(
              'Hoy ya puntuaste 2 veces en Quiz tecnico. Esta sesion no suma ranking.',
            );
          } else if (awarded > 0) {
            this.notifications.success(`+${awarded} puntos en ranking (Quiz tecnico).`);
          }
        });
    }
    this.state.set('finished');
  }

  private startTimer() {
    this.clearTimer();
    this.timeLeft.set(QUESTION_TIME_SECONDS);
    this.timerInterval = setInterval(() => {
      this.timeLeft.update((t) => {
        if (t <= 1) {
          this.clearTimer();
          const q = this.currentQuestion();
          if (q) this.selectAnswer(-1, q);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }

  private clearTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private isQuestionCategory(value: unknown): value is QuestionCategory {
    return typeof value === 'string' && value in CATEGORY_META;
  }
}
