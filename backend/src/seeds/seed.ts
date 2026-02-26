import 'reflect-metadata';
import { AppDataSource } from '../data-source';
import { Question } from '../questions/question.entity';
import { QUESTIONS_SEED } from '../questions/questions.seed';
import { DeepPartial } from 'typeorm';

async function seed() {
  const dataSource = await AppDataSource.initialize();
  const questionRepo = dataSource.getRepository(Question);

  const count = await questionRepo.count();
  if (count === 0) {
    const questions = questionRepo.create(QUESTIONS_SEED as DeepPartial<Question>[]);
    await questionRepo.save(questions);
    console.log(`✅ Seeded ${questions.length} volleyball questions`);
  } else {
    console.log(`ℹ️  Ya existen ${count} preguntas, se omite el seed`);
  }

  await dataSource.destroy();
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
