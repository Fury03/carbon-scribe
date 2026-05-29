import { RetirementAggregationService } from './services/retirement-aggregation.service';
import { RetirementAggregationHandler } from './services/retirement-aggregation.handler';
import { MongooseModule } from '@nestjs/mongoose';
import { RetirementAggregation, RetirementAggregationSchema } from './schemas/retirement-aggregation.schema';
import { WebhookDispatcherService } from '../webhooks/services/webhook-dispatcher.service';

@Module({
  imports: [
    CacheModule,
    MongooseModule.forFeature([
      { name: RetirementAggregation.name, schema: RetirementAggregationSchema },
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [
    AnalyticsService,
    DashboardService,
    PredictiveService,
    CreditQualityService,
    PerformanceService,
    ProjectComparisonService,
    RegionalService,
    TeamPerformanceService,
    TimelineService,
    PrismaService,
    RetirementAggregationService,
    RetirementAggregationHandler,
  ],
  exports: [AnalyticsService],
})
export class AnalyticsModule {
  constructor(
    private readonly dispatcher: WebhookDispatcherService,
    private readonly retirementAggregationHandler: RetirementAggregationHandler,
  ) {
    this.dispatcher.registerHandler(this.retirementAggregationHandler);
  }
}
