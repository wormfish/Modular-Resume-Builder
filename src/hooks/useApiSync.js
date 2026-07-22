import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocalStorage } from './useLocalStorage';
import * as api from '../api/client';
import {
  INITIAL_BLOCKS,
  INITIAL_RESUME,
  INITIAL_PERSONAL_INFO,
  DEFAULT_JOB_TYPES,
} from '../utils/constants';

/**
 * useApiSync – bridges localStorage state with the MongoDB API.
 *
 * On mount it tries to load from the server. If successful, server data
 * overwrites localStorage. If the server is unreachable, the app keeps
 * working with localStorage (offline-first).
 *
 * Every mutation updates local state immediately (optimistic) and then
 * syncs to the server in the background. Failures set isOnline = false
 * but do NOT roll back the local change.
 */
export function useApiSync() {
  const [blocks, setBlocks] = useLocalStorage('resume-builder-blocks', INITIAL_BLOCKS);
  const [resume, setResume] = useLocalStorage('resume-builder-canvas', INITIAL_RESUME);
  const [personalInfo, setPersonalInfo] = useLocalStorage('resume-builder-personal', INITIAL_PERSONAL_INFO);
  const [jobTypes, setJobTypes] = useLocalStorage('resume-builder-jobtypes', [...DEFAULT_JOB_TYPES]);
  const [isOnline, setIsOnline] = useState(null); // null = unknown, true/false after first check
  const isMounted = useRef(true);

  // Debounce timer for resume sync (avoids spamming on rapid edits)
  const resumeSyncTimer = useRef(null);

  // ---------- Initial load from server ----------
  useEffect(() => {
    isMounted.current = true;

    (async () => {
      try {
        const [serverBlocks, serverResumes] = await Promise.all([
          api.fetchBlocks(),
          api.fetchResumes(),
        ]);

        if (!isMounted.current) return;

        if (serverBlocks && serverBlocks.length > 0) {
          setBlocks(serverBlocks.map(normalizeBlock));
        }
        if (serverResumes && serverResumes.length > 0) {
          const r = serverResumes[0]; // use the first resume
          setResume({
            id: r._id || r.id,
            title: r.title,
            templateId: r.templateId,
            sections: r.sections || [],
          });
          if (r.personalInfo) setPersonalInfo(r.personalInfo);
          if (r.jobTypes && r.jobTypes.length > 0) setJobTypes(r.jobTypes);
        }

        setIsOnline(true);
      } catch {
        if (!isMounted.current) return;
        setIsOnline(false);
      }
    })();

    return () => {
      isMounted.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- Block sync helpers ----------

  const syncBlockCreate = useCallback(
    async (block) => {
      try {
        await api.createBlock(block);
        setIsOnline(true);
      } catch {
        setIsOnline(false);
      }
    },
    [],
  );

  const syncBlockUpdate = useCallback(
    async (id, block) => {
      try {
        await api.updateBlock(id, block);
        setIsOnline(true);
      } catch {
        setIsOnline(false);
      }
    },
    [],
  );

  const syncBlockDelete = useCallback(
    async (id) => {
      try {
        await api.deleteBlock(id);
        setIsOnline(true);
      } catch {
        setIsOnline(false);
      }
    },
    [],
  );

  // ---------- Resume sync (debounced) ----------

  const scheduleResumeSync = useCallback(
    (resumeData, personalData, jobTypesData) => {
      clearTimeout(resumeSyncTimer.current);
      resumeSyncTimer.current = setTimeout(async () => {
        try {
          await api.saveResume(resumeData, personalData, jobTypesData);
          if (isMounted.current) setIsOnline(true);
        } catch {
          if (isMounted.current) setIsOnline(false);
        }
      }, 600);
    },
    [],
  );

  // Wrap setResume to auto-sync
  const setResumeAndSync = useCallback(
    (updater) => {
      setResume((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        scheduleResumeSync(next, personalInfo, jobTypes);
        return next;
      });
    },
    [setResume, scheduleResumeSync, personalInfo, jobTypes],
  );

  const setPersonalInfoAndSync = useCallback(
    (updater) => {
      setPersonalInfo((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        scheduleResumeSync(resume, next, jobTypes);
        return next;
      });
    },
    [setPersonalInfo, scheduleResumeSync, resume, jobTypes],
  );

  const setJobTypesAndSync = useCallback(
    (updater) => {
      setJobTypes((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        scheduleResumeSync(resume, personalInfo, next);
        return next;
      });
    },
    [setJobTypes, scheduleResumeSync, resume, personalInfo],
  );

  // ---------- Public API ----------

  return {
    blocks,
    setBlocks,
    resume,
    setResume: setResumeAndSync,
    personalInfo,
    setPersonalInfo: setPersonalInfoAndSync,
    jobTypes,
    setJobTypes: setJobTypesAndSync,
    isOnline,
    syncBlockCreate,
    syncBlockUpdate,
    syncBlockDelete,
  };
}

// Mongoose returns _id; normalize to plain id for the frontend
function normalizeBlock(b) {
  return {
    id: b._id || b.id,
    type: b.type,
    jobTypes: b.jobTypes || [],
    content: b.content || {},
  };
}
