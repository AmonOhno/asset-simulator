import { Router } from 'express';
import accountsRouter from './accounts';
import creditCardsRouter from './creditCards';
import journalAccountsRouter from './journalAccounts';
import journalEntriesRouter from './journalEntries';
import regularJournalEntriesRouter from './regularJournalEntries';

const router = Router();

router.use('/accounts', accountsRouter);
router.use('/credit-cards', creditCardsRouter);
router.use('/journal-accounts', journalAccountsRouter);
router.use('/journal-entries', journalEntriesRouter);
router.use('/regular-journal-entries', regularJournalEntriesRouter);

export default router;
