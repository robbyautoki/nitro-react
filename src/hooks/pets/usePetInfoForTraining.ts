// =============================================================================
// usePetInfoForTraining — Holt PetInfo (Level, XP, Happiness, …) ad-hoc
// =============================================================================
// Wird vom Train-Panel verwendet, um zum Pet-Klick frische Stat-Daten zu
// laden. Sendet `RequestPetInfoComposer(petId)` und lauscht auf das
// resultierende `PetInfoEvent`.
//
// Re-Polling: Eine `refresh()`-Funktion erlaubt Re-Fetch nach Trainings-
// Klicks (typisch 2.5s nach Senden), damit XP-Bar live aktualisiert.
// =============================================================================

import { PetInfoEvent, RequestPetInfoComposer } from '@nitrots/nitro-renderer';
import { useCallback, useEffect, useRef, useState } from 'react';
import { SendMessageComposer } from '../../api';
import { useMessageEvent } from '../events';

export interface PetTrainingInfo
{
    id: number;
    name: string;
    level: number;
    maximumLevel: number;
    experience: number;
    levelExperienceGoal: number;
    energy: number;
    maximumEnergy: number;
    happyness: number;
    maximumHappyness: number;
    age: number;
    respect: number;
    rarityLevel: number;
    fullyGrown: boolean;
    dead: boolean;
}

interface Options
{
    petId: number | null;
}

export const usePetInfoForTraining = ({ petId }: Options) =>
{
    const [ info, setInfo ] = useState<PetTrainingInfo | null>(null);
    const expectedPetIdRef = useRef<number | null>(null);

    const request = useCallback((id: number) =>
    {
        if(!id || id < 1) return;
        expectedPetIdRef.current = id;
        SendMessageComposer(new RequestPetInfoComposer(id));
    }, []);

    useEffect(() =>
    {
        if(petId && petId > 0)
        {
            // Beim ersten Öffnen + bei Pet-Wechsel sofort frisch laden.
            request(petId);
        }
        else
        {
            setInfo(null);
            expectedPetIdRef.current = null;
        }
    }, [ petId, request ]);

    useMessageEvent<PetInfoEvent>(PetInfoEvent, event =>
    {
        const parser = event.getParser();
        if(!parser) return;
        // Nur unser Pet — der Vanilla-PetInfo-Stream wird auch vom Profile-Panel
        // genutzt, also explizit filtern.
        if(expectedPetIdRef.current !== null && parser.id !== expectedPetIdRef.current) return;

        setInfo({
            id: parser.id,
            name: parser.name,
            level: parser.level,
            maximumLevel: parser.maximumLevel,
            experience: parser.experience,
            levelExperienceGoal: parser.levelExperienceGoal,
            energy: parser.energy,
            maximumEnergy: parser.maximumEnergy,
            happyness: parser.happyness,
            maximumHappyness: parser.maximumHappyness,
            age: parser.age,
            respect: parser.respect,
            rarityLevel: parser.rarityLevel,
            fullyGrown: parser.fullyGrown,
            dead: parser.dead
        });
    });

    const refresh = useCallback(() =>
    {
        if(petId && petId > 0) request(petId);
    }, [ petId, request ]);

    return { info, refresh };
};

/**
 * Mappt Pet-Level → Tier-Label gemäß PetBrain.tierFor (Java-Server-Logik).
 *  CUB:    Lvl 1-5    → "Welpe"
 *  JUNIOR: Lvl 6-15   → "Junior"
 *  ADULT:  Lvl 16-25  → "Erwachsen"
 *  WISE:   Lvl 26+    → "Weise"
 */
export const petTierLabel = (level: number): { tier: string; label: string; minLevel: number; maxLevel: number } =>
{
    if(level >= 26) return { tier: 'WISE',   label: 'Weise',     minLevel: 26, maxLevel: 99 };
    if(level >= 16) return { tier: 'ADULT',  label: 'Erwachsen', minLevel: 16, maxLevel: 25 };
    if(level >= 6)  return { tier: 'JUNIOR', label: 'Junior',    minLevel:  6, maxLevel: 15 };
    return            { tier: 'CUB',    label: 'Welpe',     minLevel:  1, maxLevel:  5 };
};
