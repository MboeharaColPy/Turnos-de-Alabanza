import { AppState, Musician, Role, Slot } from '../types';
import { isoLocal } from '../utils/dateUtils';

export interface ShiftInstance {
  date: Date;
  dateIso: string;
  slot: Slot;
  key: string;
}

export interface GenerationOptions {
  targetSlotKeys?: string[]; // If specified, only fill these slots. Otherwise fill all in target period.
  preserveExisting?: boolean; // If true, do not overwrite slots that already have assignments
}

export interface GenerationResult {
  assignments: Record<string, Record<string, string>>;
  appliedRulesLog: string[];
  mandatoryRestMusicianIds: Set<string>;
}

/**
 * Identifies the category of a role by name
 */
export function getRoleCategory(
  roleName: string
): 'director' | 'voz_h' | 'voz_m' | 'tech' | 'instrument' {
  const norm = roleName.toLowerCase().trim();
  if (norm.includes('director')) return 'director';
  if (norm.includes('voz h') || norm.includes('voces h') || norm.includes('voz masculina') || norm.includes('tenor') || norm.includes('baritono')) {
    return 'voz_h';
  }
  if (norm.includes('voz m') || norm.includes('voces m') || norm.includes('voz femenina') || norm.includes('soprano') || norm.includes('contralto')) {
    return 'voz_m';
  }
  if (norm.includes('sonido') || norm.includes('audio visual') || norm.includes('audiovisual') || norm.includes('luces')) {
    return 'tech';
  }
  return 'instrument';
}

/**
 * Checks whether a musician is marked as Director (in roleIds or primaryRoleId)
 */
export function isMusicianDirector(m: Musician, roleMap: Map<string, Role>): boolean {
  const roles = (m.roleIds || []).map(id => roleMap.get(id)).filter((r): r is Role => Boolean(r));
  const primary = m.primaryRoleId ? roleMap.get(m.primaryRoleId) : null;
  const isDir = (r: Role) => getRoleCategory(r.name) === 'director' || r.name.toLowerCase().includes('director');
  return roles.some(isDir) || (primary ? isDir(primary) : false);
}

/**
 * Checks whether a musician is marked in voices (Voz H, Voz M, Voces, etc.)
 */
export function isMusicianInVoices(m: Musician, roleMap: Map<string, Role>): boolean {
  const roles = (m.roleIds || []).map(id => roleMap.get(id)).filter((r): r is Role => Boolean(r));
  const primary = m.primaryRoleId ? roleMap.get(m.primaryRoleId) : null;
  const isVoice = (r: Role) => {
    const cat = getRoleCategory(r.name);
    if (cat === 'voz_h' || cat === 'voz_m') return true;
    const n = r.name.toLowerCase().trim();
    return (
      n.startsWith('voz') ||
      n.includes('voces') ||
      n.includes('tenor') ||
      n.includes('soprano') ||
      n.includes('contralto') ||
      n.includes('baritono') ||
      n.includes('coro')
    );
  };
  return roles.some(isVoice) || (primary ? isVoice(primary) : false);
}

/**
 * Finds all slots ordered chronologically within a date range
 */
export function getChronologicalShiftInstances(
  state: AppState,
  startDate: Date,
  endDate: Date
): ShiftInstance[] {
  const instances: ShiftInstance[] = [];
  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  const sortedSlots = [...state.slots].sort((a, b) => a.day - b.day || a.time.localeCompare(b.time));

  while (current <= end) {
    const dayOfWeek = (current.getDay() + 6) % 7; // 0 = Lunes, 6 = Domingo
    const matchingSlots = sortedSlots.filter(s => s.day === dayOfWeek);

    matchingSlots.forEach(slot => {
      const dateCopy = new Date(current);
      const dateIso = isoLocal(dateCopy);
      instances.push({
        date: dateCopy,
        dateIso,
        slot,
        key: `${dateIso}__${slot.id}`,
      });
    });

    current.setDate(current.getDate() + 1);
  }

  // Sort strictly by date and time
  return instances.sort((a, b) => {
    const dDiff = a.date.getTime() - b.date.getTime();
    if (dDiff !== 0) return dDiff;
    return a.slot.time.localeCompare(b.slot.time);
  });
}

/**
 * Calculates consecutive shifts for each musician up to a specific point in time
 */
export function calculateConsecutiveShifts(
  allInstancesChronological: ShiftInstance[],
  currentInstanceIndex: number,
  currentAssignments: Record<string, Record<string, string>>
): Record<string, number> {
  const consecutiveCounts: Record<string, number> = {};

  for (let i = currentInstanceIndex - 1; i >= 0; i--) {
    const prevInstance = allInstancesChronological[i];
    const prevAssign = currentAssignments[prevInstance.key] || {};
    const assignedMusiciansInPrev = new Set(Object.values(prevAssign).filter(Boolean));

    assignedMusiciansInPrev.forEach(mId => {
      if (consecutiveCounts[mId] === undefined) {
        consecutiveCounts[mId] = 0;
      }
      if (consecutiveCounts[mId] === currentInstanceIndex - 1 - i) {
        consecutiveCounts[mId] += 1;
      }
    });
  }

  return consecutiveCounts;
}

/**
 * Calculates overall participation count to ensure fair rotation across the team
 */
export function calculateMusicianUsageCounts(
  currentAssignments: Record<string, Record<string, string>>
): Record<string, number> {
  const counts: Record<string, number> = {};
  Object.values(currentAssignments).forEach(slotAssign => {
    // Count each distinct musician in a shift once for overall rotation count
    const uniqueMusiciansInShift = new Set(Object.values(slotAssign).filter(Boolean));
    uniqueMusiciansInShift.forEach(mId => {
      counts[mId] = (counts[mId] || 0) + 1;
    });
  });
  return counts;
}

/**
 * Generates an automatic, fair, rotative schedule respecting all church requirements:
 * 1. Coordinated couple rotation (rest and participate together)
 * 2. Mandatory rest after 4 consecutive shifts
 * 3. Role priority (primary role preference & fair distribution)
 * 4. Vocal balance (Director counts as 1 voice: 3H + 3M total)
 * 5. Voice roles populated with eligible people, allowing non-conflicting dual roles
 *    (e.g., Instrument + Voice or Director + Voice) while keeping Tech strictly exclusive.
 */
export function generateRotativeSchedule(
  state: AppState,
  startDate: Date,
  endDate: Date,
  options: GenerationOptions = {}
): GenerationResult {
  const nextAssignments: Record<string, Record<string, string>> = {
    ...state.assignments,
  };

  const logs: string[] = [];
  const mandatoryRestSet = new Set<string>();

  const allInstances = getChronologicalShiftInstances(state, startDate, endDate);
  if (allInstances.length === 0) {
    return {
      assignments: nextAssignments,
      appliedRulesLog: ['No se encontraron turnos programados en el período seleccionado.'],
      mandatoryRestMusicianIds: mandatoryRestSet,
    };
  }

  const roleMap = new Map<string, Role>(state.roles.map(r => [r.id, r]));
  const musicianMap = new Map<string, Musician>(state.musicians.map(m => [m.id, m]));

  // Map couple partners
  const partnerMap = new Map<string, string>();
  state.couples.forEach(c => {
    partnerMap.set(c.aId, c.bId);
    partnerMap.set(c.bId, c.aId);
  });

  // Distribute couple rest shifts evenly across the timeline
  const coupleRestGiven = new Map<string, boolean>();
  state.couples.forEach(c => coupleRestGiven.set(c.id, false));

  const coupleReservedRestShiftIndex = new Map<string, number>();
  state.couples.forEach((c, idx) => {
    const targetIdx = Math.min(
      allInstances.length - 1,
      Math.max(0, (idx * 2 + 1) % allInstances.length)
    );
    coupleReservedRestShiftIndex.set(c.id, targetIdx);
  });

  // Process shift instances chronologically
  allInstances.forEach((instance, instanceIndex) => {
    if (options.targetSlotKeys && !options.targetSlotKeys.includes(instance.key)) {
      return;
    }

    const existingAssign = nextAssignments[instance.key] || {};
    if (options.preserveExisting && Object.keys(existingAssign).length > 0) {
      return;
    }

    const slot = instance.slot;
    const slotRoleIds = slot.roleIds || [];
    if (slotRoleIds.length === 0) return;

    const currentShiftAssignments: Record<string, string> = {};

    // Track assigned musicians by category in the current shift
    const assignedMusiciansInShift = new Set<string>();
    const musiciansInInstruments = new Set<string>();
    const musiciansInVoiceSlots = new Set<string>();
    const musiciansInTechRoles = new Set<string>(); // Sonido / Audio Visual (strictly exclusive)

    // 1. Mandatory Rest calculation (4 consecutive shifts)
    const consecutiveCounts = calculateConsecutiveShifts(
      allInstances,
      instanceIndex,
      nextAssignments
    );
    const overallUsage = calculateMusicianUsageCounts(nextAssignments);

    const musiciansInMandatoryRest = new Set<string>();
    Object.entries(consecutiveCounts).forEach(([mId, count]) => {
      if (count >= 4) {
        musiciansInMandatoryRest.add(mId);
        mandatoryRestSet.add(mId);
        const m = musicianMap.get(mId);
        if (m) {
          logs.push(
            `Descanso obligatorio para ${m.name} (${count} turnos seguidos) en ${instance.dateIso} (${slot.label}).`
          );
        }
      }
    });

    // 2. Coordinated couple rest
    const musiciansInCoupleRest = new Set<string>();
    state.couples.forEach(couple => {
      const reservedShift = coupleReservedRestShiftIndex.get(couple.id);
      const restAlreadyGiven = coupleRestGiven.get(couple.id);

      if (
        instanceIndex === reservedShift ||
        (!restAlreadyGiven && instanceIndex === allInstances.length - 1)
      ) {
        musiciansInCoupleRest.add(couple.aId);
        musiciansInCoupleRest.add(couple.bId);
        coupleRestGiven.set(couple.id, true);
        const ma = musicianMap.get(couple.aId);
        const mb = musicianMap.get(couple.bId);
        if (ma && mb) {
          logs.push(
            `Descanso coordinado de pareja: ${ma.name} & ${mb.name} en ${instance.dateIso}.`
          );
        }
      }
    });

    // Helper: is musician eligible for a given role (matching name or roleId)
    const getMusiciansEligibleForRole = (roleId: string): Musician[] => {
      const role = roleMap.get(roleId);
      if (!role) return [];
      const cat = getRoleCategory(role.name);
      const isVoiceSlot = cat === 'voz_h' || cat === 'voz_m';

      return state.musicians.filter(m => {
        // Regla: Los que están marcados como director, pero no están marcados en voces,
        // no deben ser tenidos en cuenta para ocupar un rol de voces semanal.
        if (isVoiceSlot) {
          const isDir = isMusicianDirector(m, roleMap);
          const inVoices = isMusicianInVoices(m, roleMap);
          if (isDir && !inVoices) {
            return false;
          }
        }

        // Direct role ID match
        if ((m.roleIds || []).includes(roleId)) return true;
        // Category fallback for voice slots: all male musicians can sing in voz_h, all female in voz_m
        if (cat === 'voz_h' && m.gender === 'H') return true;
        if (cat === 'voz_m' && m.gender === 'M') return true;
        return false;
      });
    };

    // Helper: Select best candidate
    const selectBestCandidate = (
      eligibleMusicians: Musician[],
      roleId: string,
      targetCategory: 'director' | 'instrument' | 'voz_h' | 'voz_m' | 'tech',
      preferredGender?: 'H' | 'M'
    ): Musician | null => {
      let filtered = eligibleMusicians.filter(
        m =>
          !musiciansInTechRoles.has(m.id) &&
          !musiciansInMandatoryRest.has(m.id) &&
          !musiciansInCoupleRest.has(m.id)
      );

      if (targetCategory === 'tech') {
        // Tech (Sonido/AV) is strictly exclusive: cannot have ANY other role in this shift
        filtered = filtered.filter(m => !assignedMusiciansInShift.has(m.id));
      } else if (targetCategory === 'instrument') {
        // A musician cannot play two instruments at the same time
        filtered = filtered.filter(
          m => !musiciansInInstruments.has(m.id) && !musiciansInTechRoles.has(m.id)
        );
      } else if (targetCategory === 'director') {
        // Director cannot be in Tech
        filtered = filtered.filter(m => !musiciansInTechRoles.has(m.id));
      } else if (targetCategory === 'voz_h' || targetCategory === 'voz_m') {
        // Voice slots: The assigned Director is already leading voice, so exclude assignedDirector.
        // Cannot be assigned to another voice slot in this shift, and cannot be in Tech.
        // BUT they CAN already be on an Instrument! (Permitted dual role)
        // Regla: Los directores no marcados en voces nunca son asignados a roles de voz
        const directorId = assignedDirector?.id;
        filtered = filtered.filter(
          m =>
            m.id !== directorId &&
            !musiciansInVoiceSlots.has(m.id) &&
            !musiciansInTechRoles.has(m.id) &&
            !(isMusicianDirector(m, roleMap) && !isMusicianInVoices(m, roleMap))
        );
      }

      if (preferredGender) {
        const genderFiltered = filtered.filter(m => m.gender === preferredGender);
        if (genderFiltered.length > 0) {
          filtered = genderFiltered;
        }
      }

      // Fallback: if no candidates because of couple rest, relax couple rest (NEVER relax mandatory 4-shift rest or tech exclusivity)
      if (filtered.length === 0) {
        const directorId = assignedDirector?.id;
        const fallback = eligibleMusicians.filter(m => {
          if (musiciansInMandatoryRest.has(m.id)) return false;
          if (musiciansInTechRoles.has(m.id)) return false;
          if (targetCategory === 'tech' && assignedMusiciansInShift.has(m.id)) return false;
          if (targetCategory === 'instrument' && musiciansInInstruments.has(m.id)) return false;
          if (targetCategory === 'voz_h' || targetCategory === 'voz_m') {
            if (m.id === directorId) return false;
            if (musiciansInVoiceSlots.has(m.id)) return false;
            if (isMusicianDirector(m, roleMap) && !isMusicianInVoices(m, roleMap)) return false;
          }
          return true;
        });

        if (fallback.length > 0) {
          // Array.prototype.filter siempre devuelve un array (truthy), por lo que el antiguo
          // `filter(...) || fallback` nunca usaba el respaldo y podía dejar el rol vacío.
          const fallbackByGender = preferredGender
            ? fallback.filter(m => m.gender === preferredGender)
            : fallback;
          filtered = fallbackByGender.length > 0 ? fallbackByGender : fallback;
        }
      }

      if (filtered.length === 0) return null;

      // Candidate Scoring:
      // 1) Primary Role bonus (-100 if this role is their primaryRoleId)
      // 2) Dedicated vocalists bonus for voices if not yet assigned (-30)
      // 3) Partner already scheduled in this shift bonus (-40 so couples are together)
      // 4) Usage count (lower is better for fair rotation across everyone)
      // 5) Consecutive streak count
      filtered.sort((a, b) => {
        const aPrimary = a.primaryRoleId === roleId ? -100 : 0;
        const bPrimary = b.primaryRoleId === roleId ? -100 : 0;
        if (aPrimary !== bPrimary) return aPrimary - bPrimary;

        // For voice slots, prefer vocalists not yet assigned to an instrument to maximize team participation
        if (targetCategory === 'voz_h' || targetCategory === 'voz_m') {
          const aNotInInst = !musiciansInInstruments.has(a.id) ? -30 : 0;
          const bNotInInst = !musiciansInInstruments.has(b.id) ? -30 : 0;
          if (aNotInInst !== bNotInInst) return aNotInInst - bNotInInst;
        }

        const aPartnerId = partnerMap.get(a.id);
        const bPartnerId = partnerMap.get(b.id);
        const aPartnerScheduled = aPartnerId && assignedMusiciansInShift.has(aPartnerId) ? -40 : 0;
        const bPartnerScheduled = bPartnerId && assignedMusiciansInShift.has(bPartnerId) ? -40 : 0;
        if (aPartnerScheduled !== bPartnerScheduled) return aPartnerScheduled - bPartnerScheduled;

        const usageA = overallUsage[a.id] || 0;
        const usageB = overallUsage[b.id] || 0;
        if (usageA !== usageB) return usageA - usageB;

        const streakA = consecutiveCounts[a.id] || 0;
        const streakB = consecutiveCounts[b.id] || 0;
        if (streakA !== streakB) return streakA - streakB;

        return a.name.localeCompare(b.name);
      });

      return filtered[0];
    };

    // --- STEP 1: Assign Director (Respect User-defined Director if present) ---
    const directorRoleId = slotRoleIds.find(rid => {
      const r = roleMap.get(rid);
      return r && getRoleCategory(r.name) === 'director';
    });
    let assignedDirector: Musician | null = null;

    if (directorRoleId) {
      const existingDirectorId = existingAssign[directorRoleId];
      if (existingDirectorId && musicianMap.has(existingDirectorId)) {
        // User explicitly defined this director: respect it and base suggestions on this person!
        assignedDirector = musicianMap.get(existingDirectorId)!;
        currentShiftAssignments[directorRoleId] = assignedDirector.id;
        assignedMusiciansInShift.add(assignedDirector.id);
        logs.push(`Director definido por el usuario: ${assignedDirector.name} (${instance.dateIso})`);
      } else {
        const eligibleDirectors = getMusiciansEligibleForRole(directorRoleId);
        assignedDirector = selectBestCandidate(eligibleDirectors, directorRoleId, 'director');
        if (assignedDirector) {
          currentShiftAssignments[directorRoleId] = assignedDirector.id;
          assignedMusiciansInShift.add(assignedDirector.id);
        }
      }
    }

    // --- STEP 2: Assign Core Instruments ---
    const instrumentRoleIds = slotRoleIds.filter(rid => {
      const r = roleMap.get(rid);
      return r && getRoleCategory(r.name) === 'instrument';
    });

    instrumentRoleIds.forEach(roleId => {
      // If user already assigned this instrument, preserve it
      const currentInstMusicianId = existingAssign[roleId];
      if (currentInstMusicianId && musicianMap.has(currentInstMusicianId)) {
        const m = musicianMap.get(currentInstMusicianId)!;
        currentShiftAssignments[roleId] = m.id;
        assignedMusiciansInShift.add(m.id);
        musiciansInInstruments.add(m.id);
        return;
      }

      const eligible = getMusiciansEligibleForRole(roleId);
      const chosen = selectBestCandidate(eligible, roleId, 'instrument');
      if (chosen) {
        currentShiftAssignments[roleId] = chosen.id;
        assignedMusiciansInShift.add(chosen.id);
        musiciansInInstruments.add(chosen.id);
      }
    });

    // --- STEP 3: Assign Voices with Exact Gender Balance Rule ---
    // Rule:
    // - Total singing team: 6 voices (Director + 5 accompanying voices = 3 Men + 3 Women).
    // - If Director is Hombre: 1 male director + 2 accompanying male voices + 3 female voices.
    // - If Director is Mujer: 1 female director + 2 accompanying female voices + 3 male voices.
    // - If Director is not assigned: default to 2-3 male and 2-3 female voices.
    const directorGender: 'H' | 'M' = assignedDirector?.gender || 'H';
    const targetMaleVoiceSlotsCount = directorGender === 'H' ? 2 : 3;
    const targetFemaleVoiceSlotsCount = directorGender === 'M' ? 2 : 3;

    const vocesHRoleIds = slotRoleIds
      .filter(rid => {
        const r = roleMap.get(rid);
        return r && getRoleCategory(r.name) === 'voz_h';
      })
      .sort((a, b) => {
        const ra = roleMap.get(a)?.name || '';
        const rb = roleMap.get(b)?.name || '';
        return ra.localeCompare(rb);
      });

    const vocesMRoleIds = slotRoleIds
      .filter(rid => {
        const r = roleMap.get(rid);
        return r && getRoleCategory(r.name) === 'voz_m';
      })
      .sort((a, b) => {
        const ra = roleMap.get(a)?.name || '';
        const rb = roleMap.get(b)?.name || '';
        return ra.localeCompare(rb);
      });

    // Assign Male Voice slots (up to targetMaleVoiceSlotsCount)
    vocesHRoleIds.forEach((roleId, vIdx) => {
      if (vIdx >= targetMaleVoiceSlotsCount) {
        // Exceeds required count (e.g. 3rd male voice when Director is Hombre)
        // If user already assigned it manually, preserve it; otherwise leave empty
        const currentVoiceId = existingAssign[roleId];
        if (currentVoiceId && musicianMap.has(currentVoiceId)) {
          const m = musicianMap.get(currentVoiceId)!;
          currentShiftAssignments[roleId] = m.id;
          assignedMusiciansInShift.add(m.id);
          musiciansInVoiceSlots.add(m.id);
        }
        return;
      }

      const currentVoiceId = existingAssign[roleId];
      if (currentVoiceId && musicianMap.has(currentVoiceId)) {
        const m = musicianMap.get(currentVoiceId)!;
        currentShiftAssignments[roleId] = m.id;
        assignedMusiciansInShift.add(m.id);
        musiciansInVoiceSlots.add(m.id);
        return;
      }

      const eligible = getMusiciansEligibleForRole(roleId).filter(m => m.gender === 'H');
      const chosen = selectBestCandidate(eligible, roleId, 'voz_h', 'H');
      if (chosen) {
        currentShiftAssignments[roleId] = chosen.id;
        assignedMusiciansInShift.add(chosen.id);
        musiciansInVoiceSlots.add(chosen.id);
      }
    });

    // Assign Female Voice slots (up to targetFemaleVoiceSlotsCount)
    vocesMRoleIds.forEach((roleId, vIdx) => {
      if (vIdx >= targetFemaleVoiceSlotsCount) {
        // Exceeds required count (e.g. 3rd female voice when Director is Mujer)
        // If user already assigned it manually, preserve it; otherwise leave empty
        const currentVoiceId = existingAssign[roleId];
        if (currentVoiceId && musicianMap.has(currentVoiceId)) {
          const m = musicianMap.get(currentVoiceId)!;
          currentShiftAssignments[roleId] = m.id;
          assignedMusiciansInShift.add(m.id);
          musiciansInVoiceSlots.add(m.id);
        }
        return;
      }

      const currentVoiceId = existingAssign[roleId];
      if (currentVoiceId && musicianMap.has(currentVoiceId)) {
        const m = musicianMap.get(currentVoiceId)!;
        currentShiftAssignments[roleId] = m.id;
        assignedMusiciansInShift.add(m.id);
        musiciansInVoiceSlots.add(m.id);
        return;
      }

      const eligible = getMusiciansEligibleForRole(roleId).filter(m => m.gender === 'M');
      const chosen = selectBestCandidate(eligible, roleId, 'voz_m', 'M');
      if (chosen) {
        currentShiftAssignments[roleId] = chosen.id;
        assignedMusiciansInShift.add(chosen.id);
        musiciansInVoiceSlots.add(chosen.id);
      }
    });

    // --- STEP 4: Assign Tech Roles (Sonido & Audio visual - strictly exclusive) ---
    const techRoleIds = slotRoleIds.filter(rid => {
      const r = roleMap.get(rid);
      return r && getRoleCategory(r.name) === 'tech';
    });

    techRoleIds.forEach(roleId => {
      const currentTechId = existingAssign[roleId];
      if (currentTechId && musicianMap.has(currentTechId)) {
        const m = musicianMap.get(currentTechId)!;
        currentShiftAssignments[roleId] = m.id;
        assignedMusiciansInShift.add(m.id);
        musiciansInTechRoles.add(m.id);
        return;
      }

      const eligible = getMusiciansEligibleForRole(roleId);
      const chosen = selectBestCandidate(eligible, roleId, 'tech');
      if (chosen) {
        currentShiftAssignments[roleId] = chosen.id;
        assignedMusiciansInShift.add(chosen.id);
        musiciansInTechRoles.add(chosen.id);
      }
    });

    // Save calculated assignments for this shift
    nextAssignments[instance.key] = currentShiftAssignments;
  });

  return {
    assignments: nextAssignments,
    appliedRulesLog: logs,
    mandatoryRestMusicianIds: mandatoryRestSet,
  };
}
