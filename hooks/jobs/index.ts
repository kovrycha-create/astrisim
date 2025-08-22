import type { Strand, RelationshipMatrix, ActiveJobEffect, StrandName, Vector } from '../../types';

import * as lotur from './lotur-peacemaker';
import * as memetic from './memetic-anarchist';
import * as optix from './optix-duelist';
import * as vitaris from './vitaris-sprinter';
import * as dethapart from './dethapart-finisher';
import * as draemin from './draemin-dreamer';
import * as elly from './elly-foundation';
import * as radi from './radi-beacon';
import * as voidrot from './voidrot-end';
import * as askanu from './askanu-scholar';
import * as virtuo from './virtuo-judge';
import * as cozmik from './cozmik-celestial';
import * as sanxxui from './sanxxui-empath';
import * as nectiv from './nectiv-weaver';

export interface JobUpdateResult {
    newJobEffects?: ActiveJobEffect[];
    newLogs?: string[];
    relationshipEvents?: Array<{s1Name: StrandName, s2Name: StrandName, modifier: number}>;
    forces?: Map<number, Vector>;
}

type JobUpdater = (
    strand: Strand,
    allStrands: Strand[],
    now: number,
    relationshipMatrix: RelationshipMatrix,
) => JobUpdateResult;

export const jobUpdaters: Partial<Record<StrandName, JobUpdater>> = {
    'lotŭr': lotur.update,
    'Memetic': memetic.update,
    'OptiX': optix.update,
    'Vitarîs': vitaris.update,
    'Ðethapart': dethapart.update,
    'Dræmin\'': draemin.update,
    'Elly': elly.update,
    'ℛadí': radi.update,
    'VOIDROT': voidrot.update,
    'Askänu': askanu.update,
    'Virtuō': virtuo.update,
    'Cozmik': cozmik.update,
    '丂anxxui': sanxxui.update,
    'Nectiv': nectiv.update,
};