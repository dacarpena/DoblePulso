
import { DIMENSIONS, QUESTIONS, getQuestionsForMode } from "../data/questions.js";

const clamp = (n, min = 0, max = 100) => Math.max(min, Math.min(max, n));
const round = n => Math.round(Number.isFinite(n) ? n : 0);

function questionsForSession(session, mode = "balanced") {
  if (Array.isArray(session?.questionIds) && session.questionIds.length) {
    const set = new Set(session.questionIds);
    return QUESTIONS.filter(q => set.has(q.id));
  }
  return getQuestionsForMode(mode || session?.mode || "balanced");
}

function answerValue(session, participant, qid) {
  const item = session?.answers?.[participant]?.[qid];
  if (item == null) return null;
  if (typeof item === "object") return Number(item.value);
  return Number(item);
}

export function answerLabel(question, value) {
  const v = typeof value === "object" ? Number(value.value) : Number(value);
  const opt = question?.options?.find(o => Number(o.value) === v);
  return opt ? `${opt.emoji} ${opt.label}` : "";
}

function ordinalScore(a, b, question) {
  const diff = Math.abs(Number(a) - Number(b));
  const base = clamp(100 - diff * 20);
  if (question.comparisonLogic === "critical_ordinal" && diff >= 4) return Math.max(0, base - 15);
  return base;
}

const matrices = {
  conflict: {
    "1-2": 72, "2-1": 72, "1-5": 25, "5-1": 25, "1-6": 35, "6-1": 35,
    "2-5": 48, "5-2": 48, "2-6": 42, "6-2": 42, "3-1": 62, "1-3": 62,
    "3-2": 78, "2-3": 78, "4-1": 58, "1-4": 58, "4-5": 40, "5-4": 40
  },
  directness: {
    "1-2": 88, "2-1": 88, "1-5": 40, "5-1": 40, "1-6": 25, "6-1": 25,
    "2-5": 48, "5-2": 48, "3-4": 72, "4-3": 72, "4-6": 45, "6-4": 45
  },
  listening: {
    "1-2": 90, "2-1": 90, "1-6": 30, "6-1": 30, "2-6": 38, "6-2": 38,
    "3-1": 74, "1-3": 74, "3-5": 50, "5-3": 50, "4-6": 45, "6-4": 45
  },
  repair: {
    "1-3": 78, "3-1": 78, "1-5": 58, "5-1": 58, "2-3": 80, "3-2": 80,
    "4-5": 62, "5-4": 62, "4-1": 74, "1-4": 74, "6-1": 60, "1-6": 60
  },
  initiation: {
    "1-5": 72, "5-1": 72, "1-6": 42, "6-1": 42, "2-4": 78, "4-2": 78,
    "3-3": 100, "4-5": 76, "5-4": 76, "6-6": 56
  },
  care: {
    "1-1": 100, "2-2": 100, "3-3": 100, "4-4": 100, "5-5": 100, "6-6": 100,
    "1-4": 82, "4-1": 82, "2-3": 78, "3-2": 78, "1-5": 44, "5-1": 44,
    "3-5": 50, "5-3": 50, "6-1": 55, "1-6": 55
  },
  appreciation: {
    "1-1": 100, "2-2": 100, "3-3": 100, "4-4": 100, "5-5": 100, "6-6": 75,
    "1-4": 80, "4-1": 80, "2-3": 82, "3-2": 82, "5-1": 78, "1-5": 78,
    "6-1": 50, "1-6": 50
  },
  humor: {
    "1-2": 88, "2-1": 88, "1-5": 36, "5-1": 36, "2-4": 80, "4-2": 80,
    "3-4": 76, "4-3": 76, "6-1": 54, "1-6": 54
  }
};

function categoricalScore(a, b, question) {
  const key = `${a}-${b}`;
  const matrix = matrices[question.matrixId] || {};
  if (matrix[key] != null) return matrix[key];
  if (Number(a) === Number(b)) return 100;
  const diff = Math.abs(Number(a) - Number(b));
  if (diff === 1) return 74;
  if (diff === 2) return 58;
  if (diff === 3) return 42;
  return 28;
}

export function scoreQuestion(question, a, b) {
  if (a == null || b == null) return null;
  const logic = question.comparisonLogic || "ordinal_distance";
  const score = logic === "categorical_matrix"
    ? categoricalScore(a, b, question)
    : ordinalScore(a, b, question);

  const diff = Math.abs(Number(a) - Number(b));
  const specific = specificCritical(question, Number(a), Number(b), score);
  const critical = Boolean(specific || (question.critical && (score <= 45 || diff >= 4)));
  const complementarity = !critical && logic === "categorical_matrix" && score >= 70 && diff > 0;
  const category = critical ? "critical" : score >= 85 ? "strength" : score >= 70 ? "fit" : score >= 50 ? "talk" : "friction";

  return {
    questionId: question.id,
    dimensionId: question.dimensionId,
    dimension: question.dimension,
    subdimension: question.subdimension,
    score: round(score),
    category,
    critical,
    criticalDetail: specific,
    complementarity,
    distance: diff,
    weight: question.weight,
    private: question.private,
    comparisonLogic: logic,
    matrixId: question.matrixId || null,
    reason: buildReason(score, question, diff, specific),
    conversationScript: buildConversationScript(question, score, specific)
  };
}

function specificCritical(q, a, b, score) {
  const diff = Math.abs(a - b);
  const id = q.id;
  const defs = {
    "ET-01": ["exclusivity_structure_mismatch", "alta", "Estructura de exclusividad desalineada.", "Hablad de qué significa exclusividad, deseo, libertad y seguridad para cada uno antes de asumir nada."],
    "DX-ET-04": ["exclusivity_structure_mismatch", "alta", "Propuesta de no exclusividad con respuesta potencialmente incompatible.", "Separad moralidad de encaje: ¿qué acuerdos serían realmente vivibles para ambos?"],
    "PV-03": ["children_project_mismatch", "alta", "Proyecto de hijos potencialmente desalineado.", "No lo resolváis en una frase: hablad de deseo real, tiempos, dudas y no negociables."],
    "DX-PV-02": ["children_timing_mismatch", "alta", "Hijos y tiempos sensibles.", "Aclarad si es un no, un todavía no, una duda o un sí condicionado."],
    "SI-01": ["sexual_pace_mismatch", "media-alta", "Ritmo íntimo inicial sensible.", "Hablad de ritmo físico sin convertir deseo en presión ni cautela en rechazo."],
    "SI-02": ["sexual_communication_mismatch", "alta", "Comunicación sexual y de límites desalineada.", "Acordad cómo hablar de límites de una forma que no corte el deseo ni invisibilice seguridad."],
    "SI-03": ["boundary_talk_mismatch", "alta", "Comodidad con límites explícitos desalineada.", "Definid una forma mínima y natural de comprobar consentimiento y comodidad."],
    "RA-02": ["contact_frequency_mismatch", "media", "Frecuencia de contacto muy distinta.", "Convertid “me escribes poco” o “me agobias” en acuerdos concretos de continuidad."],
    "PV-02": ["cohabitation_mismatch", "media-alta", "Convivencia potencialmente desalineada.", "Hablad de horizonte, no solo de ganas: tiempos, espacio propio y condiciones."],
    "PV-04": ["mobility_mismatch", "media-alta", "Movilidad geográfica desalineada.", "Aclarad si la distancia o una mudanza serían negociables o estructurales."],
    "ET-04": ["privacy_surveillance_mismatch", "alta", "Privacidad digital y control pueden chocar.", "Acordad transparencia sin vigilancia y privacidad sin opacidad."]
  };
  if (defs[id] && (diff >= 3 || score <= 55)) {
    const [flagId, severity, explanation, conversationPrompt] = defs[id];
    return {
      flagId,
      severity,
      explanation,
      conversationPrompt,
      canBeWorkedThroughIf: [
        "ambas personas pueden decir qué necesitan sin exigirlo como prueba de amor",
        "el acuerdo resultante es concreto y revisable",
        "ninguna persona tiene que traicionarse para sostener el vínculo"
      ]
    };
  }
  return null;
}

function buildReason(score, q, diff, specific) {
  if (specific) return specific.explanation;
  if (score >= 85) return "Encaje alto: respuestas muy próximas o estilo compartido.";
  if (score >= 70) return "Encaje suficiente: diferencia presente, probablemente conversable.";
  if (q.critical && (score <= 45 || diff >= 4)) return "Diferencia estructural: conviene hablarlo antes de seguir invirtiendo mucho.";
  if (score < 50) return "Fricción probable: la diferencia puede doler si se interpreta sin contexto.";
  return "Zona de conversación: no es bloqueo, pero necesita traducción mutua.";
}

function buildConversationScript(q, score, specific) {
  if (specific) return specific.conversationPrompt;
  if (score >= 70) return `Parece que aquí hay bastante encaje. Podéis hablar de qué detalle concreto haría que ${q.subdimension.toLowerCase()} se sienta todavía más cuidado.`;
  return `Una forma suave de hablarlo: “Creo que aquí tenemos ritmos distintos en ${q.subdimension.toLowerCase()}. Yo lo vivo de una manera y tú de otra. ¿Cómo podríamos cuidarlo sin presión ni distancia?”`;
}

function weightedAverage(items) {
  const usable = items.filter(x => x && Number.isFinite(x.score));
  const w = usable.reduce((s, x) => s + (x.weight || 1), 0);
  if (!w) return 0;
  return round(usable.reduce((s, x) => s + x.score * (x.weight || 1), 0) / w);
}

function indexScore(dimScores, ids) {
  const rows = DIMENSIONS.filter(d => ids.includes(d.id)).map(d => ({ score: dimScores[d.id]?.score, weight: d.weight }));
  return weightedAverage(rows.filter(r => r.score != null));
}

function computeMirrorFits(session, questions) {
  const groups = {};
  questions.filter(q => q.mirrorKey).forEach(q => {
    groups[q.mirrorKey] ||= {};
    groups[q.mirrorKey][q.mirrorRole] ||= [];
    groups[q.mirrorKey][q.mirrorRole].push(q);
  });

  const out = [];
  for (const [key, g] of Object.entries(groups)) {
    for (const needQ of g.need || []) {
      for (const giveQ of g.give || []) {
        const aNeed = answerValue(session, "A", needQ.id);
        const bGive = answerValue(session, "B", giveQ.id);
        const bNeed = answerValue(session, "B", needQ.id);
        const aGive = answerValue(session, "A", giveQ.id);

        if (aNeed != null && bGive != null) {
          out.push({
            mirrorKey: key,
            direction: "A_needs_B_gives",
            needQuestionId: needQ.id,
            giveQuestionId: giveQ.id,
            score: categoricalScore(aNeed, bGive, { matrixId: needQ.matrixId || giveQ.matrixId }),
            needLabel: answerLabel(needQ, aNeed),
            giveLabel: answerLabel(giveQ, bGive)
          });
        }
        if (bNeed != null && aGive != null) {
          out.push({
            mirrorKey: key,
            direction: "B_needs_A_gives",
            needQuestionId: needQ.id,
            giveQuestionId: giveQ.id,
            score: categoricalScore(bNeed, aGive, { matrixId: needQ.matrixId || giveQ.matrixId }),
            needLabel: answerLabel(needQ, bNeed),
            giveLabel: answerLabel(giveQ, aGive)
          });
        }
      }
    }
  }
  return out.map(x => ({ ...x, score: round(x.score), category: x.score >= 80 ? "mirror_strength" : x.score >= 60 ? "mirror_talk" : "mirror_friction" }));
}

function buildNarrative(results) {
  const top = [...results.dimensionScores].sort((a,b)=>b.score-a.score).slice(0,2).map(x=>x.dimension);
  const low = [...results.dimensionScores].sort((a,b)=>a.score-b.score).slice(0,2).map(x=>x.dimension);
  const blockers = results.criticalFlags.length;

  let archetype = "Conexión exploratoria";
  if (results.indices.chemistry >= 78 && results.indices.sustainability < 62) archetype = "Chispa intensa con regulación pendiente";
  else if (results.indices.security >= 78 && results.indices.project >= 74) archetype = "Base estable con buen aterrizaje";
  else if (results.indices.project < 55) archetype = "Conexión con preguntas estructurales";
  else if (results.indices.care >= 78 && results.indices.attraction >= 70) archetype = "Cercanía cálida con potencial de crecimiento";

  const summary = blockers
    ? "Hay zonas de conexión, pero también diferencias estructurales que conviene hablar antes de seguir acumulando expectativas."
    : "El perfil sugiere un mapa conversable: hay encajes claros y algunas diferencias que pueden cuidarse si se nombran pronto.";

  return {
    archetype,
    summary,
    whatClicks: top.map(d => `Buen encaje en ${d.toLowerCase()}.`),
    sensitiveZones: low.map(d => `Conviene traducir expectativas en ${d.toLowerCase()}.`),
    doNotAssume: [
      "No asumáis que silencio significa lo mismo para ambos.",
      "No convirtáis química en promesa ni cautela en rechazo.",
      "No escondáis diferencias estructurales debajo de una buena conversación."
    ],
    nextConversation: results.conversationPriorities.slice(0, 5).map(x => x.prompt)
  };
}

export function scoreSession(session, mode = "balanced") {
  const questions = questionsForSession(session, mode || session?.mode || "balanced");
  const comparisonRows = [];
  for (const q of questions) {
    const a = answerValue(session, "A", q.id);
    const b = answerValue(session, "B", q.id);
    const scored = scoreQuestion(q, a, b);
    if (scored) {
      comparisonRows.push({
        ...scored,
        answerA: a,
        answerB: b,
        labelA: answerLabel(q, a),
        labelB: answerLabel(q, b),
        question: q.text
      });
    }
  }

  const dimensionScores = DIMENSIONS.map(d => {
    const rows = comparisonRows.filter(r => r.dimensionId === d.id);
    return {
      dimensionId: d.id,
      dimension: d.name,
      score: weightedAverage(rows),
      weight: d.weight,
      count: rows.length
    };
  }).filter(x => x.count > 0);

  const dimMap = Object.fromEntries(dimensionScores.map(d => [d.dimensionId, d]));
  const indices = {
    attraction: indexScore(dimMap, ["attraction", "sexuality", "play"]),
    security: indexScore(dimMap, ["pace", "autonomy", "communication", "conflict", "trust", "sexuality"]),
    project: indexScore(dimMap, ["intent", "trust", "daily", "future"]),
    care: indexScore(dimMap, ["communication", "conflict", "care", "play"]),
  };

  const overall = round(
    indices.attraction * 0.22 +
    indices.security * 0.34 +
    indices.project * 0.28 +
    indices.care * 0.16
  );

  const lowRows = comparisonRows.filter(r => r.score < 70);
  const friction = lowRows.length ? round(lowRows.reduce((s,r)=>s + (100-r.score) * r.weight,0) / lowRows.reduce((s,r)=>s+r.weight,0)) : 0;
  const complementarityRows = comparisonRows.filter(r => r.complementarity);
  const complementarity = comparisonRows.length ? round((complementarityRows.length / comparisonRows.length) * 100) : 0;
  const criticalFlags = comparisonRows.filter(r => r.critical).sort((a,b)=>a.score-b.score || b.weight-a.weight);
  const mirrorFits = computeMirrorFits(session, questions);

  const answered = ["A","B"].reduce((sum,p)=> sum + questions.filter(q => answerValue(session,p,q.id) != null).length, 0);
  const expected = questions.length * 2;
  const completion = expected ? answered / expected : 0;
  const contextish = comparisonRows.filter(r => [3,4].includes(Number(r.answerA)) || [3,4].includes(Number(r.answerB))).length;
  const confidence = round(clamp(55 + completion * 35 - Math.min(15, contextish * 0.5) + (comparisonRows.length > 60 ? 8 : 0)));

  const conversationPriorities = [...comparisonRows]
    .filter(r => r.category === "critical" || r.score < 65)
    .sort((a,b)=> (Number(b.critical) - Number(a.critical)) || (b.weight - a.weight) || (a.score - b.score))
    .slice(0, 10)
    .map(r => ({
      questionId: r.questionId,
      dimension: r.dimension,
      score: r.score,
      critical: r.critical,
      prompt: `Hablad de “${r.question}” porque vuestras respuestas apuntan a expectativas distintas.`,
      script: r.conversationScript,
      labelA: r.labelA,
      labelB: r.labelB
    }));

  const sustainability = round(indices.security * 0.46 + indices.project * 0.36 + indices.care * 0.18);
  const misunderstandingRisk = round(clamp((100 - indexScore(dimMap, ["pace", "autonomy", "communication", "conflict", "trust"])) + criticalFlags.length * 4, 0, 100));
  const workableDifference = round(clamp(complementarity + (dimMap.play?.score || 0) * 0.10 + (dimMap.daily?.score || 0) * 0.06, 0, 100));

  const results = {
    scoringVersion: "4.0.0",
    mode: session?.mode || mode,
    overall,
    label: classifyOverall(overall, criticalFlags.length),
    indices: {
      ...indices,
      chemistry: indices.attraction,
      sustainability,
      chemistrySustainabilityGap: round(indices.attraction - sustainability),
      misunderstandingRisk,
      workableDifference,
      friction,
      complementarity,
      conversationPriority: round(Math.min(100, criticalFlags.length * 18 + lowRows.length * 2.5)),
      confidence
    },
    dimensionScores,
    comparisonRows,
    mirrorFits,
    criticalFlags,
    strengths: comparisonRows.filter(r => r.score >= 85).sort((a,b)=>b.weight-a.weight).slice(0,10),
    frictions: comparisonRows.filter(r => r.score < 65).sort((a,b)=>a.score-b.score).slice(0,10),
    complementarityRows,
    conversationPriorities,
    recommendedDiagnosticQuestionIds: recommendDiagnostics(dimensionScores, criticalFlags, session)
  };

  results.narrative = buildNarrative(results);
  return results;
}

function recommendDiagnostics(dimensionScores, criticalFlags, session) {
  if (session?.diagnosticsStarted) return [];
  const lowDims = new Set(
    dimensionScores
      .filter(d => ["sexuality","trust","daily","future"].includes(d.dimensionId) && d.score < 72)
      .map(d => d.dimensionId)
  );
  criticalFlags.forEach(f => {
    if (["sexuality","trust","daily","future"].includes(f.dimensionId)) lowDims.add(f.dimensionId);
  });
  const diagnosticIds = QUESTIONS
    .filter(q => q.diagnostic && lowDims.has(q.dimensionId))
    .map(q => q.id);
  return diagnosticIds.slice(0, 18);
}

function classifyOverall(score, blockers = 0) {
  if (blockers >= 3) return "Potencial con bloqueadores estructurales";
  if (score >= 85) return "Encaje muy alto";
  if (score >= 75) return "Encaje alto con conversación útil";
  if (score >= 62) return "Encaje moderado y sensible al contexto";
  if (score >= 50) return "Conexión posible, mucha traducción necesaria";
  return "Compatibilidad baja o muy condicionada";
}
