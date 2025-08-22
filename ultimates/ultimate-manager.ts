import type { Strand, ActiveUltimate, GlobalEffect, StrandName, Vector, RelationshipMatrix } from '../types';
import { STRAND_ULTIMATE_STATS } from '../constants';

// Import all ultimate implementations
import * as Lotur from './lotur-tranquility-nexus';
import * as Vitaris from './vitaris-vital-bloom';
import * as Elly from './elly-fissure';
import * as Cozmik from './cozmik-gravitational-collapse';
import * as Voidrot from './voidrot-corruption';
import * as Radi from './radi-revelation-flare';
import * as Virtuo from './virtuo-equilibrium-burst';
import * as OptiX from './optix-duel-arena';
import * as Sanxxui from './sanxxui-empathic-resonance';
import * as Askanu from './askanu-beacon-of-knowledge';
import * as Draemin from './draemin-dream-weave';
import * as Nectiv from './nectiv-unity-pulse';
import * as Memetic from './memetic-echo-storm';
import * as Dethapart from './dethapart-decree-of-null';

export class UltimateManager {
    private activeUltimates: ActiveUltimate[] = [];
    private globalEffects: GlobalEffect[] = [];
    private relationshipEvents: Array<{s1Name: StrandName, s2Name: StrandName, modifier: number}> = [];
    
    /**
     * Trigger an ultimate ability for a strand
     */
    public triggerUltimate(
        caster: Strand,
        strands: Strand[],
        now: number,
        relationshipMatrix: RelationshipMatrix,
        addLog: (msg: string) => void
    ): boolean {
        if (caster.ultimateCharge < caster.maxUltimateCharge || caster.ultimateCooldown > 0) {
            return false;
        }

        let ultimate: ActiveUltimate | null = null;
        let globalEffect: GlobalEffect | null = null;

        // Trigger based on strand name
        switch (caster.name) {
            case 'lotŭr':
                ultimate = Lotur.triggerTranquilityNexus(caster, strands, now);
                break;
            case 'Vitarîs':
                ultimate = Vitaris.triggerVitalBloom(caster, strands, now);
                break;
            case 'Elly':
                ultimate = Elly.triggerFissure(caster, strands, now, relationshipMatrix);
                break;
            case 'Cozmik':
                ultimate = Cozmik.triggerGravitationalCollapse(caster, strands, now);
                break;
            case 'VOIDROT':
                globalEffect = Voidrot.triggerCorruption(caster, strands, now, relationshipMatrix);
                break;
            case 'ℛadí':
                ultimate = Radi.triggerRevelationFlare(caster, strands, now, relationshipMatrix);
                break;
            case 'Virtuō':
                globalEffect = Virtuo.triggerEquilibriumBurst(caster, strands, now);
                break;
            case 'OptiX':
                ultimate = OptiX.triggerDuelArena(caster, strands, now, relationshipMatrix);
                break;
            case '丂anxxui':
                globalEffect = Sanxxui.triggerEmpathicResonance(caster, strands, now);
                break;
            case 'Askänu':
                ultimate = Askanu.triggerBeaconOfKnowledge(caster, strands, now);
                break;
            case "Dræmin'":
                globalEffect = Draemin.triggerDreamWeave(caster, strands, now);
                break;
            case 'Nectiv':
                ultimate = Nectiv.triggerUnityPulse(caster, strands, now);
                break;
            case 'Memetic':
                globalEffect = Memetic.triggerEchoStorm(caster, strands, now);
                break;
            case 'Ðethapart':
                ultimate = Dethapart.triggerDecreeOfNull(caster, strands, now);
                break;
        }

        if (ultimate) {
            this.activeUltimates.push(ultimate);
            caster.ultimateCharge = 0;
            caster.ultimateCooldown = STRAND_ULTIMATE_STATS[caster.name].cooldown;
            addLog(`${caster.name} unleashes their ultimate!`);
            return true;
        }

        if (globalEffect) {
            this.globalEffects.push(globalEffect);
            caster.ultimateCharge = 0;
            caster.ultimateCooldown = STRAND_ULTIMATE_STATS[caster.name].cooldown;
            addLog(`${caster.name} activates a global effect!`);
            return true;
        }

        return false;
    }

    /**
     * Update all active ultimates and global effects
     */
    public update(
        strands: Strand[],
        deltaSeconds: number,
        now: number,
        relationshipMatrix: RelationshipMatrix,
        addLog: (msg: string) => void
    ): {
        damageMap: Map<number, number>,
        healMap: Map<number, number>,
        forces: Map<number, Vector>,
        effects: Array<{type: string, strandId: number, value: any}>,
        visualEffects: Array<{type: string, data: any}>
    } {
        const damageMap = new Map<number, number>();
        const healMap = new Map<number, number>();
        const forces = new Map<number, Vector>();
        const effects: Array<{type: string, strandId: number, value: any}> = [];
        const visualEffects: Array<{type: string, data: any}> = [];

        // Update active ultimates
        this.activeUltimates = this.activeUltimates.filter(ultimate => {
            ultimate.life -= deltaSeconds;
            
            if (ultimate.life <= 0) {
                this.handleUltimateEnd(ultimate, strands, addLog);
                return false;
            }

            // Update based on type
            const result = this.updateUltimate(ultimate, strands, deltaSeconds, now, addLog, relationshipMatrix);
            
            // Merge results
            result.damageMap?.forEach((damage: number, id: number) => {
                damageMap.set(id, (damageMap.get(id) || 0) + damage);
            });
            result.healMap?.forEach((heal: number, id: number) => {
                healMap.set(id, (healMap.get(id) || 0) + heal);
            });
            result.forces?.forEach((force: Vector, id: number) => {
                const existing = forces.get(id) || { x: 0, y: 0 };
                forces.set(id, {
                    x: existing.x + force.x,
                    y: existing.y + force.y
                });
            });
            effects.push(...(result.effects || []));
            visualEffects.push(...(result.visualEffects || []));

            return !result.ended;
        });

        // Update global effects
        this.globalEffects = this.globalEffects.filter(effect => {
            if (now >= effect.endTime) {
                this.handleGlobalEffectEnd(effect, strands, addLog);
                return false;
            }

            const result = this.updateGlobalEffect(effect, strands, deltaSeconds, now, addLog, relationshipMatrix);
            
            // Merge results
            result.damageMap?.forEach((damage: number, id: number) => {
                damageMap.set(id, (damageMap.get(id) || 0) + damage);
            });
            result.healMap?.forEach((heal: number, id: number) => {
                healMap.set(id, (healMap.get(id) || 0) + heal);
            });
            effects.push(...(result.effects || []));
            visualEffects.push(...(result.visualEffects || []));

            return true;
        });

        return { damageMap, healMap, forces, effects, visualEffects };
    }

    private updateUltimate(
        ultimate: ActiveUltimate,
        strands: Strand[],
        deltaSeconds: number,
        now: number,
        addLog: (msg: string) => void,
        relationshipMatrix: RelationshipMatrix
    ): any {
        switch (ultimate.type) {
            case 'TRANQUILITY_NEXUS':
                return Lotur.updateTranquilityNexus(ultimate, strands, deltaSeconds, now, addLog, this.relationshipEvents, relationshipMatrix);
            case 'VITAL_BLOOM':
                return Vitaris.updateVitalBloom(ultimate, strands, deltaSeconds, now, addLog, this.relationshipEvents, relationshipMatrix);
            case 'FISSURE':
                return Elly.updateFissure(ultimate, strands, deltaSeconds, now, addLog, this.relationshipEvents, relationshipMatrix);
            case 'GRAVITATIONAL_COLLAPSE':
                return Cozmik.updateGravitationalCollapse(ultimate, strands, deltaSeconds, now, addLog, this.relationshipEvents, relationshipMatrix);
            case 'REVELATION_FLARE':
                return Radi.updateRevelationFlare(ultimate, strands, deltaSeconds, now, addLog, this.relationshipEvents, relationshipMatrix);
            case 'DUEL_ARENA':
                return OptiX.updateDuelArena(ultimate, strands, deltaSeconds, now, addLog, this.relationshipEvents, relationshipMatrix);
            case 'BEACON_OF_KNOWLEDGE':
                return Askanu.updateBeaconOfKnowledge(ultimate, strands, deltaSeconds, now, addLog, this.relationshipEvents, relationshipMatrix);
            case 'UNITY_PULSE':
                return Nectiv.updateUnityPulse(ultimate, strands, deltaSeconds, now, addLog, this.relationshipEvents, relationshipMatrix);
            case 'DECREE_OF_NULL':
                return Dethapart.updateDecreeOfNull(ultimate, strands, deltaSeconds, now, addLog, this.relationshipEvents, relationshipMatrix);
            default:
                return {};
        }
    }

    private updateGlobalEffect(
        effect: GlobalEffect,
        strands: Strand[],
        deltaSeconds: number,
        now: number,
        addLog: (msg: string) => void,
        relationshipMatrix: RelationshipMatrix
    ): any {
        switch (effect.type) {
            case 'CORRUPTION':
                return Voidrot.updateCorruption(effect, strands, deltaSeconds, now, addLog, this.relationshipEvents, relationshipMatrix);
            case 'EQUILIBRIUM_BURST':
                return Virtuo.updateEquilibriumBurst(effect, strands, deltaSeconds, now, addLog, this.relationshipEvents, relationshipMatrix);
            case 'EMPATHIC_RESONANCE':
                return Sanxxui.updateEmpathicResonance(effect, strands, deltaSeconds, now, addLog, this.relationshipEvents, relationshipMatrix);
            case 'DREAM_WEAVE':
                return Draemin.updateDreamWeave(effect, strands, deltaSeconds, now, addLog, this.relationshipEvents, relationshipMatrix);
            case 'ECHO_STORM':
                return Memetic.updateEchoStorm(effect, strands, deltaSeconds, now, addLog, this.relationshipEvents, relationshipMatrix);
            default:
                return {};
        }
    }

    private handleUltimateEnd(
        ultimate: ActiveUltimate,
        strands: Strand[],
        addLog: (msg: string) => void
    ): void {
        switch (ultimate.type) {
            case 'TRANQUILITY_NEXUS':
                Lotur.onTranquilityNexusEnd(ultimate, strands, addLog);
                break;
            case 'VITAL_BLOOM':
                Vitaris.onVitalBloomEnd(ultimate, strands, addLog);
                break;
            case 'FISSURE':
                Elly.onFissureEnd(ultimate, strands, addLog);
                break;
            case 'GRAVITATIONAL_COLLAPSE':
                Cozmik.onGravitationalCollapseEnd(ultimate, strands, addLog);
                break;
            case 'REVELATION_FLARE':
                Radi.onRevelationFlareEnd(ultimate, strands, addLog);
                break;
            case 'DUEL_ARENA':
                OptiX.onDuelArenaEnd(ultimate, strands, addLog);
                break;
            case 'BEACON_OF_KNOWLEDGE':
                Askanu.onBeaconOfKnowledgeEnd(ultimate, strands, addLog);
                break;
            case 'UNITY_PULSE':
                Nectiv.onUnityPulseEnd(ultimate, strands, addLog);
                break;
            case 'DECREE_OF_NULL':
                Dethapart.onDecreeOfNullEnd(ultimate, strands, addLog);
                break;
        }
    }

    private handleGlobalEffectEnd(
        effect: GlobalEffect,
        strands: Strand[],
        addLog: (msg: string) => void
    ): void {
        switch (effect.type) {
            case 'CORRUPTION':
                Voidrot.onCorruptionEnd(effect, strands, addLog);
                break;
            case 'EQUILIBRIUM_BURST':
                Virtuo.onEquilibriumBurstEnd(effect, strands, addLog);
                break;
            case 'EMPATHIC_RESONANCE':
                Sanxxui.onEmpathicResonanceEnd(effect, strands, addLog);
                break;
            case 'DREAM_WEAVE':
                Draemin.onDreamWeaveEnd(effect, strands, addLog);
                break;
            case 'ECHO_STORM':
                Memetic.onEchoStormEnd(effect, strands, addLog);
                break;
        }
    }

    /**
     * Render all active ultimates and effects
     */
    public render(
        ctx: CanvasRenderingContext2D,
        strands: Strand[],
        now: number
    ): void {
        // Render ultimates
        this.activeUltimates.forEach(ultimate => {
            switch (ultimate.type) {
                case 'TRANQUILITY_NEXUS':
                    Lotur.renderTranquilityNexus(ctx, ultimate, strands, now);
                    break;
                case 'VITAL_BLOOM':
                    Vitaris.renderVitalBloom(ctx, ultimate, strands, now);
                    break;
                case 'FISSURE':
                    Elly.renderFissure(ctx, ultimate, strands, now);
                    break;
                case 'GRAVITATIONAL_COLLAPSE':
                    Cozmik.renderGravitationalCollapse(ctx, ultimate, strands, now);
                    break;
                case 'REVELATION_FLARE':
                    Radi.renderRevelationFlare(ctx, ultimate, strands, now);
                    break;
                case 'DUEL_ARENA':
                    OptiX.renderDuelArena(ctx, ultimate, strands, now);
                    break;
                case 'BEACON_OF_KNOWLEDGE':
                    Askanu.renderBeaconOfKnowledge(ctx, ultimate, strands, now);
                    break;
                case 'UNITY_PULSE':
                    Nectiv.renderUnityPulse(ctx, ultimate, strands, now);
                    break;
                case 'DECREE_OF_NULL':
                    Dethapart.renderDecreeOfNull(ctx, ultimate, strands, now);
                    break;
            }
        });

        // Render global effects
        this.globalEffects.forEach(effect => {
            switch (effect.type) {
                case 'CORRUPTION':
                    Voidrot.renderCorruption(ctx, effect, strands, now);
                    break;
                case 'EQUILIBRIUM_BURST':
                    Virtuo.renderEquilibriumBurst(ctx, effect, strands, now);
                    break;
                case 'EMPATHIC_RESONANCE':
                    Sanxxui.renderEmpathicResonance(ctx, effect, strands, now);
                    break;
                case 'DREAM_WEAVE':
                    Draemin.renderDreamWeave(ctx, effect, strands, now);
                    break;
                case 'ECHO_STORM':
                    Memetic.renderEchoStorm(ctx, effect, strands, now);
                    break;
            }
        });
    }

    /**
     * Get relationship events for processing
     */
    public getRelationshipEvents(): Array<{s1Name: StrandName, s2Name: StrandName, modifier: number}> {
        const events = [...this.relationshipEvents];
        this.relationshipEvents = [];
        return events;
    }

    /**
     * Check if healing should be blocked
     */
    public checkHealingBlock(strandId: number, strands: Strand[], now: number): boolean {
        // Check for VOIDROT corruption
        for (const effect of this.globalEffects) {
            if (effect.type === 'CORRUPTION' && effect.data.affectedStrands.includes(strandId)) {
                const result = Voidrot.interceptHealing(strandId, 1, strands, now);
                return result.blocked;
            }
        }
        return false;
    }

    /**
     * Check for damage sharing (Empathic Resonance)
     */
    public checkDamageSharing(
        targetId: number,
        damage: number,
        strands: Strand[],
        now: number
    ): Map<number, number> {
        for (const effect of this.globalEffects) {
            if (effect.type === 'EMPATHIC_RESONANCE') {
                const result = Sanxxui.interceptDamage(targetId, damage, effect, strands, now);
                return result.sharedDamage;
            }
        }
        return new Map([[targetId, damage]]);
    }

    /**
     * Get all active ultimates
     */
    public getActiveUltimates(): ActiveUltimate[] {
        return [...this.activeUltimates];
    }

    /**
     * Get all global effects
     */
    public getGlobalEffects(): GlobalEffect[] {
        return [...this.globalEffects];
    }

    /**
     * Clear all ultimates and effects (for reset)
     */
    public clear(): void {
        this.activeUltimates = [];
        this.globalEffects = [];
        this.relationshipEvents = [];
    }
}
