import { Router } from 'express';
import { supabase } from '../config/supabase';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// GET /api/journal-entries/view
router.get('/', authMiddleware, async (req, res) => {
  try {
    const user_id = req.user?.id;
    const { startDate, endDate, description, debitId, creditId, filterMode } = req.query;

    // First, fetch IDs of journal_entries for this user within date range (to avoid implicit limits)
    let idsQuery: any = supabase.from('journal_entries').select('id').eq('user_id', user_id);
    if (startDate) idsQuery = idsQuery.gte('date', String(startDate));
    if (endDate) idsQuery = idsQuery.lte('date', String(endDate));
    // ensure we fetch all in-range ids (avoid default pagination truncation)
    idsQuery = idsQuery.order('date', { ascending: true }).range(0, 99999);

    const { data: idsData, error: idsErr } = await idsQuery;
    if (idsErr) {
      console.error('Error fetching user journal entry ids:', idsErr);
      throw idsErr;
    }

    let ids = (idsData || []).map((i: any) => i.id);
    // normalize: remove falsy and duplicates
    ids = Array.from(new Set(ids.filter((v: any) => v !== null && v !== undefined)));
    if (ids.length === 0) {
      // nothing to return
      res.json([]);
      return;
    }
    // Some databases / APIs reject extremely large IN lists. If ids is large, query in chunks and merge results.
    const MAX_IN_LIST = 200; // keep chunks small to avoid server rejecting long IN lists
    let allRows: any[] = [];

    // Robust query that will split the chunk on failure to avoid 'Bad Request' due to oversized/complex IN clauses
    const queryChunk = async (chunk: any[]): Promise<any[]> => {
      if (!chunk || chunk.length === 0) return [];

      let q: any = supabase.from('v_journal_entries').select('*').in('entries_id', chunk);
      if (description) q = q.ilike('description', `%${String(description)}%`);
      if (debitId && creditId) {
        if (filterMode === 'AND') {
          q = q.eq('debit_id', String(debitId)).eq('credit_id', String(creditId));
        } else {
          q = q.or(`debit_id.eq.${String(debitId)},credit_id.eq.${String(creditId)}`);
        }
      } else if (debitId) {
        q = q.eq('debit_id', String(debitId));
      } else if (creditId) {
        q = q.eq('credit_id', String(creditId));
      }

      try {
        const { data, error } = await q.order('date', { ascending: true }).order('amount', { ascending: false });
        if (error) {
          console.error('Error querying v_journal_entries chunk:', error, 'chunkSize=', chunk.length, 'exampleIds=', chunk.slice(0, 5));
          throw error;
        }
        return data || [];
      } catch (err: any) {
        // If the chunk is small, rethrow; otherwise split and retry
        if (chunk.length <= 10) {
          console.error('Chunk query failed and too small to split further:', chunk.length, err);
          throw err;
        }
        const mid = Math.floor(chunk.length / 2);
        const left = chunk.slice(0, mid);
        const right = chunk.slice(mid);
        console.log(`Chunk query failed; splitting into ${left.length} and ${right.length}`);
        const leftRes = await queryChunk(left);
        const rightRes = await queryChunk(right);
        return leftRes.concat(rightRes);
      }
    };

    if (ids.length <= MAX_IN_LIST) {
      allRows = await queryChunk(ids);
    } else {
      for (let i = 0; i < ids.length; i += MAX_IN_LIST) {
        const chunk = ids.slice(i, i + MAX_IN_LIST);
        console.log(`Querying v_journal_entries chunk ${i / MAX_IN_LIST + 1} (${chunk.length} ids)`);
        const rows = await queryChunk(chunk);
        allRows = allRows.concat(rows);
      }
      // dedupe by entries_id
      const seen = new Set<string>();
      allRows = allRows.filter((r: any) => {
        if (!r || !r.entries_id) return false;
        if (seen.has(String(r.entries_id))) return false;
        seen.add(String(r.entries_id));
        return true;
      });
      // final sort
      allRows.sort((a: any, b: any) => {
        if (a.date < b.date) return -1;
        if (a.date > b.date) return 1;
        return (b.amount || 0) - (a.amount || 0);
      });
    }

    res.json(allRows);
  } catch (error: any) {
    console.error('Error in journal entries view route:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

export default router;
