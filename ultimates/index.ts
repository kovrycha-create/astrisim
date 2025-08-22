
import type { ActiveUltimate, GlobalEffect, Strand, StrandName, Vector, TransientVfx, ActiveJobEffect, Creature } from '../types';
import * as lotur from './lotur-tranquility-nexus';
import * as vitaris from './vitaris-vital-bloom';
import * as elly from './elly-fissure';
import * as cozmik from './cozmik-gravitational-collapse';
import * as voidrot from './voidrot-corruption';
import * as radi from './radi-revelation-flare';
import * as virtuo from './virtuo-equilibrium-burst';
import * as optix from './optix-duel-arena';
import * as sanxxui from './sanxxui-empathic-resonance';
import * as askanu from './askanu-beacon-of-knowledge';
import * as draemin from './draemin-dream-weave';
import * as nectiv from './nectiv-unity-pulse';
import * as memetic from './memetic-echo-storm';
import * as dethapart from './dethapart-decree-of-null';
import * as vfxRenderers from './vfx-renderers';
import * as creatureVfx from './creature-vfx-renderers';

export const ultimateTriggers = {
    'TRANQUILITY_NEXUS': lotur.triggerTranquilityNexus,
    'VITAL_BLOOM': vitaris.triggerVitalBloom,
    'FISSURE': elly.triggerFissure,
    'GRAVITATIONAL_COLLAPSE': cozmik.triggerGravitationalCollapse,
    'REVELATION_FLARE': radi.triggerRevelationFlare,
    'DUEL_ARENA': optix.triggerDuelArena,
    'BEACON_OF_KNOWLEDGE': askanu.triggerBeaconOfKnowledge,
    'UNITY_PULSE': nectiv.triggerUnityPulse,
    'DECREE_OF_NULL': dethapart.triggerDecreeOfNull,
};

export const globalEffectTriggers = {
    'CORRUPTION': voidrot.triggerCorruption,
    'EQUILIBRIUM_BURST': virtuo.triggerEquilibriumBurst,
    'EMPATHIC_RESONANCE': sanxxui.triggerEmpathicResonance,
    'DREAM_WEAVE': draemin.triggerDreamWeave,
    'ECHO_STORM': memetic.triggerEchoStorm,
};

export const ultimateUpdaters = {
    'TRANQUILITY_NEXUS': lotur.updateTranquilityNexus,
    'VITAL_BLOOM': vitaris.updateVitalBloom,
    'FISSURE': elly.updateFissure,
    'GRAVITATIONAL_COLLAPSE': cozmik.updateGravitationalCollapse,
    'REVELATION_FLARE': radi.updateRevelationFlare,
    'DUEL_ARENA': optix.updateDuelArena,
    'BEACON_OF_KNOWLEDGE': askanu.updateBeaconOfKnowledge,
    'UNITY_PULSE': nectiv.updateUnityPulse,
    'DECREE_OF_NULL': dethapart.updateDecreeOfNull,
};

export const globalEffectUpdaters = {
    'CORRUPTION': voidrot.updateCorruption,
    'EQUILIBRIUM_BURST': virtuo.updateEquilibriumBurst,
    'EMPATHIC_RESONANCE': sanxxui.updateEmpathicResonance,
    'DREAM_WEAVE': draemin.updateDreamWeave,
    'ECHO_STORM': memetic.updateEchoStorm,
};

export const ultimateEnders = {
    'TRANQUILITY_NEXUS': lotur.onTranquilityNexusEnd,
    'VITAL_BLOOM': vitaris.onVitalBloomEnd,
    'FISSURE': elly.onFissureEnd,
    'GRAVITATIONAL_COLLAPSE': cozmik.onGravitationalCollapseEnd,
    'REVELATION_FLARE': radi.onRevelationFlareEnd,
    'DUEL_ARENA': optix.onDuelArenaEnd,
    'BEACON_OF_KNOWLEDGE': askanu.onBeaconOfKnowledgeEnd,
    'UNITY_PULSE': nectiv.onUnityPulseEnd,
    'DECREE_OF_NULL': dethapart.onDecreeOfNullEnd,
};

export const globalEffectEnders = {
    'CORRUPTION': voidrot.onCorruptionEnd,
    'EQUILIBRIUM_BURST': virtuo.onEquilibriumBurstEnd,
    'EMPATHIC_RESONANCE': sanxxui.onEmpathicResonanceEnd,
    'DREAM_WEAVE': draemin.onDreamWeaveEnd,
    'ECHO_STORM': memetic.onEchoStormEnd,
};

export const ultimateRenderers = {
    'TRANQUILITY_NEXUS': lotur.renderTranquilityNexus,
    'VITAL_BLOOM': vitaris.renderVitalBloom,
    'FISSURE': elly.renderFissure,
    'GRAVITATIONAL_COLLAPSE': cozmik.renderGravitationalCollapse,
    'REVELATION_FLARE': radi.renderRevelationFlare,
    'DUEL_ARENA': optix.renderDuelArena,
    'BEACON_OF_KNOWLEDGE': askanu.renderBeaconOfKnowledge,
    'UNITY_PULSE': nectiv.renderUnityPulse,
    'DECREE_OF_NULL': dethapart.renderDecreeOfNull,
};

export const globalEffectRenderers = {
    'CORRUPTION': voidrot.renderCorruption,
    'EQUILIBRIUM_BURST': virtuo.renderEquilibriumBurst,
    'EMPATHIC_RESONANCE': sanxxui.renderEmpathicResonance,
    'DREAM_WEAVE': draemin.renderDreamWeave,
    'ECHO_STORM': memetic.renderEchoStorm,
};

export const transientVfxRenderers = {
    'CHARGE_SURGE': vfxRenderers.renderChargeGainEffect,
    'LOW_HP_ACTIVATION': vfxRenderers.renderLowHpActivation,
    'EVOLUTION': creatureVfx.renderEvolution,
    'STANCE_SWITCH': creatureVfx.renderStanceSwitch,
};

export const creatureVfxRenderers: { [key: string]: (ctx: CanvasRenderingContext2D, effect: ActiveJobEffect, entities: { creatures: Creature[], strands: Strand[] }, now: number) => void } = {
    'WHISPER_BUFFER_FIELD': creatureVfx.renderWhisperBufferField,
    'SYMPATHY_THREAD': creatureVfx.renderSympathyThread,
    'VERDANT_PULSE': creatureVfx.renderVerdantPulse,
    'EQUINOX_BURST': creatureVfx.renderEquinoxBurst,
    'CREATURE_TRAIL': creatureVfx.renderCreatureTrail as any,
};


export const healingInterceptors = {
    'CORRUPTION': voidrot.interceptHealing,
};

export const damageInterceptors = {
    'EMPATHIC_RESONANCE': sanxxui.interceptDamage,
};
