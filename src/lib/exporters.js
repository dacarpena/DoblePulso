
import { QUESTIONS, getQuestionsForMode } from "../data/questions.js";
import { answerLabel } from "./scoring.js";

function questionsForSession(session, mode = "balanced") {
  if (Array.isArray(session?.questionIds) && session.questionIds.length) {
    const set = new Set(session.questionIds);
    return QUESTIONS.filter(q => set.has(q.id));
  }
  return getQuestionsForMode(mode);
}

const csvCell = value => {
  const str = typeof value === "string" ? value : JSON.stringify(value ?? "");
  return `"${str.replaceAll('"','""')}"`;
};

export function buildFullExport(session, results, mode = "balanced") {
  const questions = questionsForSession(session, mode);
  const responseRows = [];
  const comparisonRows = results?.comparisonRows || [];

  for (const p of ["A","B"]) {
    for (const q of questions) {
      const raw = session?.answers?.[p]?.[q.id] || null;
      const value = raw?.value ?? null;
      responseRows.push({
        sessionId: session.id,
        mode,
        participant: p,
        participantName: session.participants?.[p]?.name || `Persona ${p}`,
        questionId: q.id,
        dimension: q.dimension,
        subdimension: q.subdimension,
        question: q.text,
        answerValue: value,
        answerLabel: answerLabel(q, value),
        private: Boolean(q.private || raw?.private),
        answeredAt: raw?.answeredAt || null
      });
    }
  }

  return {
    schema: "doble-pulso-export-v4",
    exportedAt: new Date().toISOString(),
    session: {
      id: session.id,
      mode,
      flowMode: session.flowMode || "free",
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      completedAt: session.completedAt || null,
      participants: session.participants
    },
    results,
    questions,
    responseRows,
    comparisonRows
  };
}

export function responsesCsv(session, mode = "balanced") {
  const data = buildFullExport(session, null, mode).responseRows;
  const headers = ["sessionId","mode","participant","participantName","questionId","dimension","subdimension","question","answerValue","answerLabel","private","answeredAt"];
  return [headers.join(","), ...data.map(row => headers.map(h => csvCell(row[h])).join(","))].join("\n");
}

export function comparisonsCsv(results) {
  const data = results?.comparisonRows || [];
  const headers = ["questionId","dimension","subdimension","question","score","category","critical","complementarity","comparisonLogic","answerA","labelA","answerB","labelB","reason","conversationScript"];
  return [headers.join(","), ...data.map(row => headers.map(h => csvCell(row[h])).join(","))].join("\n");
}

export function textReport(session, results) {
  const a = session.participants?.A?.name || "Persona A";
  const b = session.participants?.B?.name || "Persona B";
  const lines = [];
  lines.push(`DOBLE PULSO v4`);
  lines.push(`${a} × ${b}`);
  lines.push(`Resultado: ${results.overall}/100 · ${results.label}`);
  lines.push(`Arquetipo: ${results.narrative.archetype}`);
  lines.push("");
  lines.push("ÍNDICES");
  for (const [k,v] of Object.entries(results.indices)) lines.push(`- ${k}: ${v}`);
  lines.push("");
  lines.push("RESUMEN");
  lines.push(results.narrative.summary);
  lines.push("");
  lines.push("FORTALEZAS");
  results.strengths.slice(0,8).forEach(r => lines.push(`- ${r.dimension}: ${r.question} (${r.score})`));
  lines.push("");
  lines.push("ZONAS A HABLAR");
  results.conversationPriorities.slice(0,8).forEach(r => {
    lines.push(`- ${r.dimension}: ${r.prompt} (${r.score})`);
    lines.push(`  Guion: ${r.script}`);
  });
  if (results.criticalFlags.length) {
    lines.push("");
    lines.push("BLOQUEADORES O DIFERENCIAS ESTRUCTURALES");
    results.criticalFlags.slice(0,8).forEach(r => {
      lines.push(`- ${r.dimension}: ${r.question} (${r.score})`);
      if (r.criticalDetail?.conversationPrompt) lines.push(`  Conversación: ${r.criticalDetail.conversationPrompt}`);
    });
  }
  lines.push("");
  lines.push("NO ASUMIR");
  results.narrative.doNotAssume.forEach(x => lines.push(`- ${x}`));
  return lines.join("\n");
}

export function download(filename, content, type = "text/plain;charset=utf-8") {
  const blob = content instanceof Blob ? content : new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 500);
}

export async function shareJson(data) {
  const file = new File([JSON.stringify(data, null, 2)], "doble-pulso-export.json", { type: "application/json" });
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: "Doble Pulso", text: "Export completo del test" });
    return true;
  }
  return false;
}

export async function buildZipBlob(session, results) {
  const { default: JSZip } = await import("jszip");
  const fullExport = buildFullExport(session, results, session.mode);
  const zip = new JSZip();
  zip.file("doble-pulso-export-completo.json", JSON.stringify(fullExport, null, 2));
  zip.file("doble-pulso-respuestas.csv", responsesCsv(session, session.mode));
  zip.file("doble-pulso-comparaciones.csv", comparisonsCsv(results));
  zip.file("doble-pulso-informe.txt", textReport(session, results));
  zip.file("metadata.json", JSON.stringify({
    generatedAt: new Date().toISOString(),
    app: "Doble Pulso",
    version: "4.0.0",
    sessionId: session.id,
    mode: session.mode
  }, null, 2));
  return zip.generateAsync({ type: "blob" });
}

export async function downloadZip(session, results) {
  const blob = await buildZipBlob(session, results);
  download("doble-pulso-export-completo.zip", blob, "application/zip");
}

export function exportPng(session, results) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext("2d");

  const gradient = ctx.createLinearGradient(0,0,1080,1920);
  gradient.addColorStop(0, "#191520");
  gradient.addColorStop(1, "#30213b");
  ctx.fillStyle = gradient;
  ctx.fillRect(0,0,1080,1920);

  ctx.fillStyle = "rgba(255,105,150,.25)";
  ctx.beginPath(); ctx.arc(160,150,260,0,Math.PI*2); ctx.fill();
  ctx.fillStyle = "rgba(130,110,255,.22)";
  ctx.beginPath(); ctx.arc(980,140,320,0,Math.PI*2); ctx.fill();

  ctx.fillStyle = "#fff7ef";
  ctx.font = "900 74px system-ui, -apple-system, sans-serif";
  ctx.fillText("Doble Pulso",70,135);
  ctx.font = "500 34px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "#cfc3d8";
  ctx.fillText(`${session.participants?.A?.name || "Persona A"} × ${session.participants?.B?.name || "Persona B"}`,70,190);

  ctx.fillStyle = "#ff6f9f";
  ctx.font = "900 210px system-ui, -apple-system, sans-serif";
  ctx.fillText(String(results.overall),70,440);
  ctx.fillStyle = "#cfc3d8";
  ctx.font = "800 52px system-ui, -apple-system, sans-serif";
  ctx.fillText("/100",350,415);

  ctx.fillStyle = "#fff7ef";
  ctx.font = "800 45px system-ui, -apple-system, sans-serif";
  wrap(ctx, results.label, 70, 520, 930, 52);

  let y = 670;
  ctx.font = "900 42px system-ui, -apple-system, sans-serif";
  ctx.fillText("Índices",70,y);
  y += 58;
  const indices = [
    ["Química", results.indices.chemistry],
    ["Sostenibilidad", results.indices.sustainability],
    ["Seguridad", results.indices.security],
    ["Proyecto", results.indices.project],
    ["Malentendidos", results.indices.misunderstandingRisk],
    ["Conversación", results.indices.conversationPriority]
  ];
  indices.forEach(([name,val]) => {
    ctx.fillStyle = "#fff7ef";
    ctx.font = "700 32px system-ui, -apple-system, sans-serif";
    ctx.fillText(name,70,y);
    ctx.fillStyle = "#cfc3d8";
    ctx.fillText(String(val),900,y);
    bar(ctx,70,y+18,860,18, name === "Malentendidos" || name === "Conversación" ? 100-val : val);
    y += 82;
  });

  y += 28;
  ctx.fillStyle = "#fff7ef";
  ctx.font = "900 42px system-ui, -apple-system, sans-serif";
  ctx.fillText("Arquetipo",70,y);
  y += 56;
  ctx.font = "600 34px system-ui, -apple-system, sans-serif";
  y = wrap(ctx, results.narrative.archetype, 70, y, 930, 42) + 22;

  ctx.font = "900 42px system-ui, -apple-system, sans-serif";
  ctx.fillText("Conversación clave",70,y);
  y += 56;
  ctx.font = "500 30px system-ui, -apple-system, sans-serif";
  wrap(ctx, results.conversationPriorities[0]?.script || "Hablad de lo que más os haya sorprendido del resultado.", 70, y, 930, 38);

  ctx.fillStyle = "#cfc3d8";
  ctx.font = "500 24px system-ui, -apple-system, sans-serif";
  ctx.fillText("Resumen visual: el ZIP incluye todos los datos completos.",70,1840);

  canvas.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "doble-pulso-resumen.png";
    a.click();
    setTimeout(()=>URL.revokeObjectURL(url), 500);
  });
}

function bar(ctx,x,y,w,h,val){
  ctx.fillStyle = "rgba(255,255,255,.15)";
  roundRect(ctx,x,y,w,h,9); ctx.fill();
  const g = ctx.createLinearGradient(x,0,x+w,0);
  g.addColorStop(0,"#73e6a5");
  g.addColorStop(1,"#8b7cff");
  ctx.fillStyle = g;
  roundRect(ctx,x,y,w*Math.max(0,Math.min(100,val))/100,h,9); ctx.fill();
}

function roundRect(ctx,x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.arcTo(x+w,y,x+w,y+h,r);
  ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r);
  ctx.arcTo(x,y,x+w,y,r);
  ctx.closePath();
}

function wrap(ctx, text, x, y, maxWidth, lineHeight) {
  const words = String(text).split(" ");
  let line = "";
  for (let i=0;i<words.length;i++) {
    const test = `${line}${words[i]} `;
    if (ctx.measureText(test).width > maxWidth && i > 0) {
      ctx.fillText(line, x, y);
      line = `${words[i]} `;
      y += lineHeight;
    } else line = test;
  }
  ctx.fillText(line, x, y);
  return y + lineHeight;
}
