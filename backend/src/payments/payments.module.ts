import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './entities/payment.entity';
import { PaymentAllocation } from './entities/payment-allocation.entity';
import { PaymentWebhookEvent } from './entities/payment-webhook-event.entity';
import { ReconciliationRecord } from './entities/reconciliation-record.entity';
import { PackageTier } from '../packages/entities/package-tier.entity';
import { Installment } from '../installments/entities/installment.entity';
import { PaymentsService } from './payments.service';
import { PaymentsRepository } from './payments.repository';
import { BookingsModule } from '../bookings/bookings.module';
import {
  PaymentsController,
  MockPaymentsController,
  WebhooksController,
  AdminPaymentsController,
} from './payments.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Payment,
      PaymentAllocation,
      PaymentWebhookEvent,
      ReconciliationRecord,
      PackageTier,
      Installment,
    ]),
    BookingsModule,
  ],
  controllers: [
    PaymentsController,
    MockPaymentsController,
    WebhooksController,
    AdminPaymentsController,
  ],
  providers: [PaymentsService, PaymentsRepository],
  exports: [PaymentsService, TypeOrmModule],
})
export class PaymentsModule {}
