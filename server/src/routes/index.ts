import { Router } from 'express';
import journalAccountsRouter from './journalAccounts';
import journalEntriesRouter from './journalEntries';
import balanceSheetViewRouter from './balanceSheetView';
import profitLossStatementViewRouter from './profitLossStatementView';
import regularJournalEntriesRouter from './regularJournalEntries';
import scheduleEventsRouter from './scheduleEvents';

const router = Router();

router.use('/journal-accounts', journalAccountsRouter);
router.use('/journal-entries', journalEntriesRouter);
router.use('/balance-sheet-view', balanceSheetViewRouter);
router.use('/profit-loss-statement-view', profitLossStatementViewRouter);
router.use('/regular-journal-entries', regularJournalEntriesRouter);
router.use('/schedule-events', scheduleEventsRouter);
export default router;
