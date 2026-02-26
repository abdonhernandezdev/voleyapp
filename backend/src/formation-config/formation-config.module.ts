import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FormationZoneConfig } from './entities/formation-zone-config.entity';
import { FormationConfigService } from './formation-config.service';
import { FormationConfigController } from './formation-config.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FormationZoneConfig])],
  providers: [FormationConfigService],
  controllers: [FormationConfigController],
  exports: [FormationConfigService],
})
export class FormationConfigModule {}
