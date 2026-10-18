import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository, SelectQueryBuilder } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { PaymentWebhookEvent } from './entities/payment-webhook-event.entity';
import { ReconciliationRecord } from './entities/reconciliation-record.entity';
import { PaymentStatus } from './enums/payment-status.enum';

/**
 * Data-access layer for payment-owned tables.
 *
 * Owns all simple CRUD and lookup queries for `Payment`,
 * `PaymentWebhookEvent`, and `ReconciliationRecord`.
 *
 * Out of scope (by design):
 * - `PaymentAllocation` is only ever written inside the multi-entity
 *   transaction in `PaymentsService.processSuccessfulPayment`, so it
 *   stays in the service (a wrapper around the default connection
 *   cannot participate in an `EntityManager` transaction).
 * - `Booking`, `PackageTier`, `Installment` are cross-module entities
 *   that the service reads/locks directly inside the same transaction.
 *
 * Multi-entity transactional flows therefore intentionally stay in
 * `PaymentsService` rather than being routed through this repository.
 */
@Injectable()
export class PaymentsRepository {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(PaymentWebhookEvent)
    private readonly webhookEventRepo: Repository<PaymentWebhookEvent>,
    @InjectRepository(ReconciliationRecord)
    private readonly reconciliationRepo: Repository<ReconciliationRecord>,
  ) {}

  // ─── Payment ──────────────────────────────────────────────────────────────

  createPayment(input: DeepPartial<Payment>): Payment {
    return this.paymentRepo.create(input);
  }

  savePayment(payment: Payment): Promise<Payment> {
    return this.paymentRepo.save(payment);
  }

  findPaymentById(id: string): Promise<Payment | null> {
    return this.paymentRepo.findOne({ where: { id } });
  }

  findPaymentByIdWithRelations(id: string): Promise<Payment | null> {
    return this.paymentRepo.findOne({
      where: { id },
      relations: ['booking', 'allocations', 'allocations.installment'],
    });
  }

  findPaymentByGatewayTransactionId(
    gatewayTransactionId: string,
  ): Promise<Payment | null> {
    return this.paymentRepo.findOne({
      where: { gateway_transaction_id: gatewayTransactionId },
    });
  }

  findPaymentByGatewayTransactionIdAndStatus(
    gatewayTransactionId: string,
    status: PaymentStatus,
  ): Promise<Payment | null> {
    return this.paymentRepo.findOne({
      where: {
        gateway_transaction_id: gatewayTransactionId,
        status,
      },
    });
  }

  /**
   * Returns a `SelectQueryBuilder<Payment>` pre-configured with the
   * default ordering and the `booking` join. The caller applies
   * additional filters and pagination before executing.
   */
  listPaymentsQuery(): SelectQueryBuilder<Payment> {
    return this.paymentRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.booking', 'b')
      .orderBy('p.created_at', 'DESC');
  }

  // ─── PaymentWebhookEvent ──────────────────────────────────────────────────

  findWebhookEventByEventId(
    eventId: string,
  ): Promise<PaymentWebhookEvent | null> {
    return this.webhookEventRepo.findOne({ where: { event_id: eventId } });
  }

  createWebhookEvent(
    input: DeepPartial<PaymentWebhookEvent>,
  ): PaymentWebhookEvent {
    return this.webhookEventRepo.create(input);
  }

  saveWebhookEvent(event: PaymentWebhookEvent): Promise<PaymentWebhookEvent> {
    return this.webhookEventRepo.save(event);
  }

  // ─── ReconciliationRecord ────────────────────────────────────────────────

  createReconciliationRecord(
    input: DeepPartial<ReconciliationRecord>,
  ): ReconciliationRecord {
    return this.reconciliationRepo.create(input);
  }

  saveReconciliationRecord(
    record: ReconciliationRecord,
  ): Promise<ReconciliationRecord> {
    return this.reconciliationRepo.save(record);
  }

  findReconciliationById(id: string): Promise<ReconciliationRecord | null> {
    return this.reconciliationRepo.findOne({ where: { id } });
  }

  /**
   * Returns a `SelectQueryBuilder<ReconciliationRecord>` pre-configured
   * with the default ordering and the `payment` join. The caller
   * applies additional filters and pagination before executing.
   */
  listReconciliationQuery(): SelectQueryBuilder<ReconciliationRecord> {
    return this.reconciliationRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.payment', 'p')
      .orderBy('r.created_at', 'DESC');
  }
}
