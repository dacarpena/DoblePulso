
const opt = (items, axis = "position", invert = false) =>
  items.map(([emoji, label], i) => {
    const value = i + 1;
    const v = invert ? 7 - value : value;
    return { value, emoji, label, tags: { [axis]: v, position: value } };
  });

const O = {
  intent: opt([
    ["💍","Quiero construir algo serio si hay encaje real."],
    ["🌱","Me apetece algo que pueda crecer sin correr."],
    ["🧭","Quiero conocer con intención, pero sin cerrar pronto."],
    ["🪶","Prefiero algo ligero, cuidado y sin promesas rápidas."],
    ["🌫️","Ahora mismo no tengo del todo claro qué busco."],
    ["🚪","No estoy buscando una relación ni algo que se parezca."]
  ], "casual_orientation"),

  availability: opt([
    ["🫶","Me siento disponible y con ganas de implicarme si fluye."],
    ["🌿","Estoy disponible, aunque prefiero avanzar con calma."],
    ["🧳","Tengo espacio emocional, pero mi vida ahora está bastante llena."],
    ["🔄","Estoy abierto/a, pero necesito comprobar mucho antes de entrar."],
    ["🛡️","Me noto algo protegido/a y me cuesta dejar entrar a alguien."],
    ["🪫","Ahora mismo tengo poca energía emocional para vincularme."]
  ], "guardedness"),

  clarity: opt([
    ["🗺️","Me gusta hablar pronto de qué estamos construyendo."],
    ["📍","Necesito señales claras aunque no haya etiqueta todavía."],
    ["🕯️","Puedo ir viendo, pero agradezco claridad progresiva."],
    ["🌫️","Prefiero dejarlo respirar y hablarlo solo si surge."],
    ["🪁","Las etiquetas tempranas me pesan bastante."],
    ["🧊","Evito definirlo; me incomoda sentir expectativas."]
  ], "label_avoidance"),

  pace: opt([
    ["🐢","Muy despacio; necesito tiempo antes de implicarme."],
    ["🚶","Constante y tranquilo, sin saltos bruscos."],
    ["🌊","Natural: ni forzar ni frenar si está fluyendo."],
    ["🔥","Intenso si hay química y reciprocidad."],
    ["🎢","Me dejo llevar mucho por el momento."],
    ["🚀","Si me gusta alguien, puedo ir muy rápido."]
  ], "pace_intensity"),

  contact: opt([
    ["📴","Poco contacto; no necesito hablar todos los días."],
    ["🍃","Algo cada pocos días me parece suficiente al principio."],
    ["🕯️","Contacto regular, pero sin estar encima."],
    ["📲","Me gusta alguna señal diaria sencilla."],
    ["💬","Me gusta hablar bastante si hay conexión."],
    ["🔥","Si me gusta alguien, quiero mucha continuidad."]
  ], "contact_need"),

  silence: opt([
    ["🌊","Lo vivo con calma; un día no significa nada."],
    ["🍃","Lo noto, pero puedo esperar sin preocuparme demasiado."],
    ["🕯️","Depende del contexto y de cómo venía la conexión."],
    ["📡","Me gusta recibir alguna señal sencilla de continuidad."],
    ["🪫","Me inquieta y tiendo a protegerme o desconectarme."],
    ["🚨","Lo interpreto rápido como falta de interés."]
  ], "need_for_reassurance"),

  plan_change: opt([
    ["🧘","Lo acepto con calma si avisa y propone alternativa."],
    ["🌿","Me molesta un poco, pero lo puedo recolocar."],
    ["🕯️","Depende mucho del motivo y del tono."],
    ["📌","Necesito una explicación y un nuevo plan concreto."],
    ["🪫","Me toca bastante y empiezo a dudar del interés."],
    ["🚧","Lo vivo como señal fuerte de poca prioridad."]
  ], "plan_sensitivity"),

  space: opt([
    ["🧲","Me gusta mucha cercanía y compartir bastante mundo."],
    ["🫶","Me gusta sentirnos cerca, con espacio razonable."],
    ["⚖️","Quiero equilibrio claro entre pareja y vida propia."],
    ["🌿","Necesito bastante espacio individual para estar bien."],
    ["🪁","Si siento mucha cercanía seguida, necesito tomar aire."],
    ["🏝️","Mi independencia es central; no quiero sentir fusión."]
  ], "space_need"),

  friends: opt([
    ["👥","Me gusta integrar pronto a alguien en mi círculo."],
    ["🌱","Me gusta integrarlo si la conexión va tomando forma."],
    ["⚖️","Depende de la persona y del momento."],
    ["🚪","Prefiero esperar bastante antes de mezclar mundos."],
    ["🏝️","Me gusta mantener círculos separados durante mucho tiempo."],
    ["🔒","Mi vida social es bastante privada al principio."]
  ], "private_world"),

  communication_discomfort: opt([
    ["📣","Lo digo de forma directa y cuidadosa pronto."],
    ["📝","Lo ordeno primero y luego lo hablo claro."],
    ["🕯️","Espero el momento adecuado para no cargar la escena."],
    ["🎭","Lo suavizo con humor o indirectas."],
    ["📦","Me lo guardo hasta ver si se repite."],
    ["🚪","Me alejo o bajo intensidad antes de hablarlo."]
  ], "avoidance"),

  needs_expression: opt([
    ["🗣️","Puedo pedir lo que necesito con bastante claridad."],
    ["🌿","Lo digo, aunque a veces necesito un poco de valor."],
    ["🕯️","Lo digo si siento que hay espacio seguro."],
    ["🧩","Lo insinúo antes de decirlo directamente."],
    ["📦","Me cuesta pedir; espero que la otra persona lo note."],
    ["🧊","Prefiero no necesitar mucho ni mostrar demasiado."]
  ], "vulnerability_guard"),

  listening: opt([
    ["🫂","Primero valido cómo se siente y luego hablo."],
    ["👂","Escucho y hago preguntas para entender bien."],
    ["🧠","Intento ordenar los hechos y buscar una solución."],
    ["⚖️","Escucho, pero también necesito defender mi parte."],
    ["😶","Me bloqueo un poco si la emoción es intensa."],
    ["🛡️","Me pongo a la defensiva si siento acusación."]
  ], "defensiveness"),

  conflict_style: opt([
    ["🔥","Prefiero hablarlo en el momento hasta aclararlo."],
    ["⏸️","Necesito una pausa breve y volver después."],
    ["🧠","Necesito analizar qué pasó antes de responder."],
    ["🪶","Intento bajar tensión con humor o ligereza."],
    ["🧊","Me cierro si siento demasiada presión."],
    ["🌪️","Me cuesta regularme y puedo subir intensidad."]
  ], "conflict_style"),

  repair_need: opt([
    ["🙏","Una disculpa clara y responsable."],
    ["🧭","Una explicación honesta de qué pasó."],
    ["🔧","Ver un cambio concreto después."],
    ["🫂","Sentir cercanía, ternura o gesto de reparación."],
    ["⏳","Tiempo para que se me pase el cuerpo."],
    ["🪶","Quitarle peso juntos y recuperar buen tono."]
  ], "repair_preference"),

  apology: opt([
    ["🙏","Pido perdón claro cuando veo mi parte."],
    ["🧭","Pido perdón y explico qué me pasó por dentro."],
    ["🔧","Me centro en cambiar conducta más que en hablar mucho."],
    ["⏳","Necesito tiempo para verlo sin defenderme."],
    ["🛡️","Me cuesta pedir perdón si me siento atacado/a."],
    ["🧊","Me cuesta mucho reconocerlo en caliente."]
  ], "defensiveness"),

  attraction_growth: opt([
    ["⚡","Necesito chispa física bastante clara desde el inicio."],
    ["🔥","La química física pesa mucho, aunque puede crecer."],
    ["🧠","La mente y la conversación pueden encender bastante."],
    ["🌱","La atracción me crece con confianza y trato."],
    ["🫶","Necesito ternura y seguridad para desear de verdad."],
    ["🧩","Mi deseo cambia mucho según contexto y vínculo."]
  ], "responsive_desire"),

  initiation: opt([
    ["🚀","Me gusta tomar iniciativa de forma clara."],
    ["😉","Me gusta insinuar y ver si la otra persona sigue."],
    ["⚖️","Me gusta que la iniciativa esté equilibrada."],
    ["🫣","Me cuesta iniciar, pero respondo si hay confianza."],
    ["🧲","Prefiero que la otra persona tome más iniciativa."],
    ["🛡️","Necesito mucha seguridad antes de mostrar deseo."]
  ], "need_for_safety"),

  desire_mismatch: opt([
    ["🗣️","Lo hablaría con naturalidad y cuidado."],
    ["🧭","Intentaría entender si es ritmo, estrés o deseo real."],
    ["🕯️","Le daría tiempo antes de sacar conclusiones."],
    ["🪫","Me afectaría y necesitaría tranquilidad."],
    ["🧊","Me cerraría un poco para no sentir rechazo."],
    ["🚨","Lo viviría como señal fuerte de incompatibilidad."]
  ], "desire_mismatch_sensitivity"),

  sex_pace: opt([
    ["🐢","Muy despacio; necesito confianza clara."],
    ["🌿","Con calma y señales de seguridad."],
    ["🌊","Natural, si ambas personas lo sienten."],
    ["🔥","Rápido puede estar bien si hay química y cuidado."],
    ["🎢","Me dejo llevar mucho por el deseo del momento."],
    ["🚀","Si hay atracción, me gusta avanzar sin esperar mucho."]
  ], "sexual_pace"),

  sex_talk: opt([
    ["🗣️","Me gusta hablar de deseo, límites y gustos con claridad."],
    ["🌿","Me gusta hablarlo, aunque con un poco de pudor."],
    ["🕯️","Puedo hablarlo si el contexto es íntimo y tranquilo."],
    ["🌊","Prefiero que fluya y hablar solo si hace falta."],
    ["🫣","Me da bastante vergüenza nombrarlo directamente."],
    ["🧊","Evito hablar de sexo o límites salvo que sea inevitable."]
  ], "sex_talk_avoidance"),

  boundaries: opt([
    ["🟢","Nombrar límites me parece atractivo y necesario."],
    ["🌿","Me gusta que se hable con naturalidad y sin drama."],
    ["🕯️","Lo agradezco si surge en un momento adecuado."],
    ["🌊","Prefiero leer señales y ajustar sin verbalizar tanto."],
    ["🫣","Me incomoda un poco, aunque entiendo que ayuda."],
    ["🚫","Me corta bastante tener que hablarlo explícitamente."]
  ], "boundary_avoidance"),

  exclusivity: opt([
    ["💍","Necesito monogamia/exclusividad clara para implicarme."],
    ["🔐","Me gusta avanzar hacia exclusividad pronto si hay conexión."],
    ["🧭","Prefiero acordarlo explícitamente según evolucione."],
    ["🌿","Puedo estar sin exclusividad un tiempo si hay honestidad."],
    ["🪁","Prefiero modelos flexibles o no cerrados."],
    ["🌫️","No quiero definir exclusividad ahora mismo."]
  ], "nonexclusive_orientation"),

  jealousy: opt([
    ["🌊","Suelo confiar y no me activo fácilmente."],
    ["🍃","Puedo notar algo, pero lo regulo bastante bien."],
    ["🕯️","Me afecta si hay ambigüedad o poca claridad."],
    ["📡","Necesito señales de transparencia para estar tranquilo/a."],
    ["🪫","Me cuesta y puedo sobrepensar bastante."],
    ["🚨","Si siento amenaza, necesito control o mucha confirmación."]
  ], "jealousy_activation"),

  ex_boundaries: opt([
    ["🌊","Me parece bien si hay respeto y límites claros."],
    ["🍃","No me molesta si es transparente y no invade."],
    ["🕯️","Depende de la historia y del tipo de contacto."],
    ["📌","Necesito saber bastante para sentirme tranquilo/a."],
    ["🪫","Me incomoda y puede activar inseguridad."],
    ["🚧","Preferiría que no hubiera contacto cercano con ex."]
  ], "boundary_need"),

  privacy_phone: opt([
    ["🔒","La privacidad individual me parece básica."],
    ["🌿","Confío; solo hablaría si algo concreto me preocupa."],
    ["🕯️","Prefiero transparencia general, no revisar nada."],
    ["📱","Me tranquiliza cierta apertura con el móvil/redes."],
    ["📡","Necesito mucha claridad para no imaginar cosas."],
    ["🔍","Si dudo, me cuesta no querer comprobar."]
  ], "surveillance_impulse"),

  care_stress: opt([
    ["🫂","Me acerco, escucho y pregunto qué necesita."],
    ["🛠️","Intento ayudar de forma práctica."],
    ["🧭","Busco entender el problema y ordenar opciones."],
    ["🕯️","Estoy presente, pero sin invadir."],
    ["🪶","Intento distraer o aligerar el ambiente."],
    ["😶","Me bloqueo un poco si no sé cómo ayudar."]
  ], "care_style"),

  care_need: opt([
    ["🫂","Necesito presencia emocional y sentirme acompañado/a."],
    ["🛠️","Agradezco ayuda práctica y soluciones concretas."],
    ["🧭","Necesito ordenar lo que pasa hablando claro."],
    ["🕯️","Necesito compañía tranquila sin demasiadas preguntas."],
    ["🏝️","Necesito espacio y volver cuando esté mejor."],
    ["🪶","Me ayuda que me saquen un poco del drama."]
  ], "care_need"),

  appreciation: opt([
    ["💌","Expreso aprecio con palabras claras."],
    ["🎁","Lo muestro con detalles y gestos."],
    ["🛠️","Lo muestro ayudando y estando pendiente."],
    ["🕰️","Lo muestro dedicando tiempo de calidad."],
    ["🤲","Lo muestro con contacto y ternura."],
    ["😶","Lo siento mucho, pero no siempre lo expreso."]
  ], "appreciation_style"),

  money: opt([
    ["🐖","Soy muy prudente y necesito control del gasto."],
    ["📊","Me gusta planificar y hablarlo con claridad."],
    ["⚖️","Busco equilibrio entre ahorrar y disfrutar."],
    ["🎟️","Me gusta gastar en experiencias si merecen la pena."],
    ["🌊","Soy flexible y no quiero mirar cada euro."],
    ["🎢","El dinero me cuesta ordenarlo o hablarlo."]
  ], "spending_flex"),

  order: opt([
    ["✨","Necesito bastante orden para estar en paz."],
    ["🧺","Prefiero orden, pero sin obsesionarme."],
    ["⚖️","Me adapto si hay mínimos compartidos."],
    ["🌿","Tolero bastante desorden cotidiano."],
    ["🎨","Mi caos funcional no me molesta mucho."],
    ["🌪️","El orden no suele ser prioridad para mí."]
  ], "mess_tolerance"),

  phone: opt([
    ["📵","Me importa mucho estar presentes sin móvil."],
    ["🌿","Prefiero limitarlo cuando estamos juntos."],
    ["⚖️","Me parece bien si no corta la conexión."],
    ["📲","Lo uso bastante, pero intento cuidar el momento."],
    ["🌊","No me molesta que cada uno use el móvil."],
    ["🧲","Estoy muy conectado/a y me cuesta soltarlo."]
  ], "technoference_risk"),

  routine: opt([
    ["🌅","Necesito rutinas bastante estables."],
    ["📅","Me gusta planificar la semana con cierto orden."],
    ["⚖️","Me va bien una mezcla de rutina e improvisación."],
    ["🌙","Funciono mejor con flexibilidad."],
    ["🎢","Me gusta improvisar y cambiar planes."],
    ["🌀","Mis horarios son variables y poco previsibles."]
  ], "spontaneity"),

  children: opt([
    ["👶","Quiero hijos claramente en mi proyecto vital."],
    ["🌱","Probablemente sí, si la vida y la pareja encajan."],
    ["🕯️","No lo sé; necesito tiempo y contexto."],
    ["🌿","Probablemente no, salvo que algo cambie mucho."],
    ["🚫","No quiero hijos."],
    ["🧩","No lo tengo resuelto y prefiero no decidir pronto."]
  ], "children_axis"),

  cohabitation: opt([
    ["🏡","Me gustaría convivir si la relación va bien."],
    ["🌱","Lo veo posible, pero sin prisa."],
    ["🧭","Depende mucho de la etapa y de la logística."],
    ["🏠","Prefiero espacios separados bastante tiempo."],
    ["🏝️","Valoro mucho vivir a mi manera."],
    ["🚪","No me veo conviviendo en un horizonte cercano."]
  ], "solo_home_need"),

  mobility: opt([
    ["🧳","Podría moverme por amor si el proyecto encaja."],
    ["🌍","Lo contemplaría si también suma a mi vida."],
    ["⚖️","Lo negociaría con mucho realismo."],
    ["📍","Me costaría bastante cambiar de ciudad/país."],
    ["🏠","Mi arraigo pesa mucho."],
    ["🚫","No cambiaría mi lugar de vida por una relación."]
  ], "location_fixedness"),

  career: opt([
    ["🚀","Mi proyecto/carrera es prioridad muy alta ahora."],
    ["📈","Es muy importante, pero puedo hacer espacio."],
    ["⚖️","Busco equilibrio entre vínculo y proyecto."],
    ["🌿","La relación podría ganar prioridad si es buena."],
    ["🫶","Doy mucho peso a la vida afectiva."],
    ["🧭","Mi prioridad cambia según etapa y persona."]
  ], "career_axis"),

  family: opt([
    ["👨‍👩‍👧","Me gusta integrar familia pronto si va bien."],
    ["🌱","Me gusta hacerlo cuando empieza a tomar forma."],
    ["⚖️","Depende de la relación y de la familia."],
    ["🚪","Prefiero esperar bastante."],
    ["🏝️","Mi relación y mi familia pueden ir bastante separadas."],
    ["🧊","No me gusta que la familia pese mucho en la pareja."]
  ], "family_separation"),

  humor_tension: opt([
    ["🫧","El humor me ayuda a suavizar y acercarme."],
    ["😉","Me gusta jugar, pero sé cuándo ponerme serio/a."],
    ["⚖️","Depende del momento; puede ayudar o molestar."],
    ["🧠","En tensión prefiero claridad antes que bromas."],
    ["😶","El humor en conflicto puede hacerme sentir no tomado/a en serio."],
    ["🎭","A veces uso humor para no mostrar incomodidad."]
  ], "humor_under_tension"),

  growth: opt([
    ["🌱","Me ilusiona crecer y aprender en pareja."],
    ["🚀","Me atrae mucho que nos impulsemos mutuamente."],
    ["⚖️","Me gusta crecer, pero sin convertirlo en proyecto constante."],
    ["🏡","Prefiero estabilidad y disfrute cotidiano."],
    ["🧘","No quiero que una relación me exija cambiar mucho."],
    ["🧊","Si alguien intenta mejorarme, me cierro."]
  ], "change_resistance"),

  success: opt([
    ["🏆","Me alegra y lo celebro activamente."],
    ["🌟","Me inspira y me acerca a esa persona."],
    ["⚖️","Me alegra, aunque puedo compararme a veces."],
    ["🕯️","Depende de cómo lo viva la otra persona."],
    ["🪫","Puede tocar inseguridades si me siento atrás."],
    ["🛡️","Me cuesta si siento que me deja en un lugar pequeño."]
  ], "comparison_sensitivity"),

  adaptability: opt([
    ["🧩","Me interesa entender la diferencia y buscar acuerdo."],
    ["🤝","Puedo ceder si siento reciprocidad."],
    ["⚖️","Negocio si el tema no toca algo central."],
    ["📌","Necesito que queden reglas claras."],
    ["🧱","Me cuesta moverme si para mí es importante."],
    ["🚧","Si algo choca mucho conmigo, prefiero no forzarlo."]
  ], "rigidity")
};

export const DIMENSIONS = [
  { id:"intent", name:"Intención y disponibilidad", weight:1.15, indices:["project","security"] },
  { id:"pace", name:"Ritmo, contacto y ambigüedad", weight:1.10, indices:["security","friction"] },
  { id:"autonomy", name:"Cercanía y autonomía", weight:1.00, indices:["security"] },
  { id:"communication", name:"Comunicación emocional", weight:1.15, indices:["security","care"] },
  { id:"conflict", name:"Conflicto y reparación", weight:1.20, indices:["security","care"] },
  { id:"attraction", name:"Atracción, deseo e iniciativa", weight:0.95, indices:["attraction"] },
  { id:"sexuality", name:"Sexualidad, consentimiento y ritmo", weight:1.05, indices:["attraction","security"] },
  { id:"trust", name:"Exclusividad, confianza y límites", weight:1.15, indices:["project","security"] },
  { id:"care", name:"Cuidado, aprecio y reciprocidad", weight:1.10, indices:["care","security"] },
  { id:"daily", name:"Vida cotidiana y negociación", weight:0.80, indices:["project","friction"] },
  { id:"future", name:"Proyecto vital", weight:1.20, indices:["project"] },
  { id:"play", name:"Juego, admiración y crecimiento", weight:0.65, indices:["attraction","care"] }
];

const dimName = id => DIMENSIONS.find(d => d.id === id)?.name || id;

const WHY = {
  intent: ["La intención y la disponibilidad evitan que una persona invierta desde una expectativa que la otra no comparte.","Puede aparecer una diferencia estructural: una persona busca dirección y la otra ligereza o baja definición."],
  pace: ["El ritmo y la tolerancia a la ambigüedad suelen definir si el inicio se siente cuidado o presionante.","Una persona puede leer calma como desinterés, y la otra puede vivir la demanda como presión."],
  autonomy: ["La regulación cercanía-espacio afecta cómo se interpreta la independencia dentro del vínculo.","Una necesidad legítima de espacio puede sentirse como distancia, o una necesidad legítima de cercanía como invasión."],
  communication: ["La comunicación temprana predice si los roces se convierten en claridad o en acumulación silenciosa.","La diferencia puede generar indirectas, defensividad o malentendidos repetidos."],
  conflict: ["La reparación importa más que no discutir: define si la tensión vuelve al vínculo o lo erosiona.","Un estilo de hablar ahora puede chocar con un estilo de pausa, especialmente si nadie explica el retorno."],
  attraction: ["La atracción y la iniciativa muestran si la química puede crecer con seguridad y reciprocidad.","Puede haber magnetismo desigual, dudas físicas o ritmos de deseo difíciles de nombrar."],
  sexuality: ["La intimidad requiere ritmo, consentimiento, comunicación y seguridad, no solo deseo.","Un desajuste puede sentirse como presión, rechazo o falta de libertad si no se habla con cuidado."],
  trust: ["La confianza se construye con acuerdos compatibles sobre exclusividad, privacidad y límites.","Los desacuerdos pueden activar celos, vigilancia, ambigüedad o expectativas incompatibles."],
  care: ["El cuidado y el aprecio sostienen la conexión cuando hay estrés, inseguridad o cansancio.","Una persona puede dar justo lo que la otra no reconoce como cuidado."],
  daily: ["La vida cotidiana no predice todo, pero crea microfricciones que se acumulan si no se negocian.","Las diferencias prácticas pueden volverse símbolo de desinterés o falta de colaboración."],
  future: ["El proyecto vital contiene variables estructurales que no siempre se compensan con química.","Hijos, convivencia, movilidad o carrera pueden ser líneas de fractura si se evitan demasiado."],
  play: ["El juego, la admiración y el crecimiento aumentan conexión, pero no deben tapar desajustes centrales.","Puede haber mucha chispa con poca sostenibilidad si las bases no acompañan."]
};

const buildQuestion = ([id, dimensionId, subdimension, text, optKey, comparisonLogic="ordinal_distance", weight=1, critical=false, priv=false, matrixId=null, mirrorKey=null, mirrorRole=null, diagnostic=false]) => ({
  id,
  dimensionId,
  dimension: dimName(dimensionId),
  subdimension,
  text,
  type: "single_6",
  options: O[optKey],
  comparisonLogic,
  matrixId,
  weight,
  critical,
  private: priv,
  diagnostic,
  mirrorKey,
  mirrorRole,
  measures: subdimension,
  whyItMatters: WHY[dimensionId][0],
  riskIfMismatch: WHY[dimensionId][1]
});

const SPECS = [
  ["IA-01","intent","Intención actual","Ahora mismo, si aparece una conexión buena, lo que más se parece a mí es…","intent","critical_ordinal",1.25,true],
  ["IA-02","intent","Disponibilidad emocional","Cuando noto que alguien empieza a importarme, normalmente…","availability","ordinal_distance",1.05],
  ["IA-03","intent","Claridad progresiva","Si la otra persona propone hablar de qué estáis construyendo, yo…","clarity","critical_ordinal",1.15,true],
  ["IA-04","intent","Compromiso progresivo","Si la conexión va bien durante varias semanas, mi tendencia es…","intent","critical_ordinal",1.15,true],
  ["IA-05","intent","Ritmo de inversión","Cuando me ilusiono, mi ritmo natural suele ser…","pace","ordinal_distance",0.9],
  ["IA-06","intent","Carga vital actual","Si mi vida está llena pero alguien me gusta, normalmente…","availability","ordinal_distance",0.95],

  ["RA-01","pace","Silencio y contacto","Si te gusta alguien y pasáis un día sin hablar, normalmente…","silence","ordinal_distance",1.15],
  ["RA-02","pace","Frecuencia de mensajes","Al principio, el contacto por chat que mejor me sienta es…","contact","critical_ordinal",1.1,true],
  ["RA-03","pace","Cambio de plan","Si la otra persona cambia un plan con poco margen, yo…","plan_change","ordinal_distance",1.05],
  ["RA-04","pace","Velocidad de avance","Si la otra persona propone veros mucho desde el principio, yo…","pace","ordinal_distance",0.95],
  ["RA-05","pace","Claridad ante señales mixtas","Cuando noto señales mixtas, mi reacción típica es…","clarity","ordinal_distance",1],
  ["RA-06","pace","Tolerancia a indefinición","Si no está claro qué sois pero hay conexión, yo…","silence","ordinal_distance",1],

  ["CA-01","autonomy","Necesidad de espacio","En una conexión que me gusta, el espacio individual para mí es…","space","ordinal_distance",1.1],
  ["CA-02","autonomy","Vida social propia","Respecto a mantener planes propios con amigos, yo…","friends","ordinal_distance",0.9],
  ["CA-03","autonomy","Fines de semana separados","Si la otra persona quiere un fin de semana para sí misma, yo…","silence","ordinal_distance",0.85],
  ["CA-04","autonomy","Fusión inicial","Cuando una conexión se vuelve muy intensa, yo…","space","ordinal_distance",1],
  ["CA-05","autonomy","Mundos separados","Sobre mezclar círculos sociales al principio, yo…","friends","ordinal_distance",0.8],
  ["CA-06","autonomy","Significado del espacio","Cuando alguien me pide espacio, normalmente lo vivo como…","silence","ordinal_distance",1],

  ["CE-01","communication","Molestia temprana","Si algo pequeño me molesta cuando aún nos estamos conociendo, suelo…","communication_discomfort","categorical_matrix",1.15,false,false,"directness"],
  ["CE-02","communication","Expresión de necesidades","Cuando necesito algo afectivo de la otra persona, suelo…","needs_expression","ordinal_distance",1.05,false,false,null,"care_request","need"],
  ["CE-03","communication","Escucha y validación","Si la otra persona me cuenta algo vulnerable, mi tendencia es…","listening","categorical_matrix",1.1,false,false,"listening"],
  ["CE-04","communication","Decir interés","Si me gusta alguien, mostrarlo con palabras me resulta…","needs_expression","ordinal_distance",0.9],
  ["CE-05","communication","Conversaciones incómodas","Ante una conversación incómoda pero necesaria, yo…","communication_discomfort","categorical_matrix",1.1,false,false,"directness"],
  ["CE-06","communication","Respuesta ante emoción intensa","Si la otra persona está emocionalmente activada, yo…","listening","categorical_matrix",1.05,false,false,"listening"],

  ["CR-01","conflict","Estilo de conflicto","Cuando aparece un conflicto, mi tendencia principal es…","conflict_style","categorical_matrix",1.2,false,false,"conflict"],
  ["CR-02","conflict","Reparación necesaria","Después de un roce, lo que más me ayuda a volver al vínculo es…","repair_need","categorical_matrix",1.1,false,false,"repair","repair_need","need"],
  ["CR-03","conflict","Responsabilidad","Cuando veo que he hecho daño, normalmente…","apology","ordinal_distance",1.15],
  ["CR-04","conflict","Pausa y retorno","Si necesito parar una discusión, mi forma ideal sería…","conflict_style","categorical_matrix",1.05,false,false,"conflict"],
  ["CR-05","conflict","Tono defensivo","Si siento que me acusan, suelo…","apology","ordinal_distance",1.05],
  ["CR-06","conflict","Qué cuenta como reparación","Para mí, reparar de verdad significa sobre todo…","repair_need","categorical_matrix",1.05,false,false,"repair"],

  ["AD-01","attraction","Atracción inicial","Para que me apetezca seguir, la atracción al inicio suele necesitar…","attraction_growth","ordinal_distance",1.05,false,true],
  ["AD-02","attraction","Deseo mental/físico","Cuando alguien me atrae, normalmente se enciende más por…","attraction_growth","ordinal_distance",0.95,false,true],
  ["AD-03","attraction","Iniciativa","Cuando hay tensión física, mi estilo de iniciativa suele ser…","initiation","categorical_matrix",0.95,false,true,"initiation","desire_initiation","give"],
  ["AD-04","attraction","Atracción que crece","Si no hay chispa física inmediata pero sí conexión mental, yo…","attraction_growth","ordinal_distance",1,false,true],
  ["AD-05","attraction","Diferencia de deseo","Si noto que deseo más que la otra persona, yo…","desire_mismatch","ordinal_distance",1,false,true],
  ["AD-06","attraction","Mostrar deseo","Cuando quiero que alguien note mi deseo, suelo…","initiation","categorical_matrix",0.9,false,true,"initiation"],

  ["SI-01","sexuality","Ritmo sexual inicial","Al principio, prefiero que la intimidad física avance…","sex_pace","critical_ordinal",1.2,true,true],
  ["SI-02","sexuality","Hablar de deseo y límites","Para mí, hablar explícitamente de deseo, límites y gustos es…","sex_talk","critical_ordinal",1.25,true,true],
  ["SI-03","sexuality","Límites y consentimiento","Si alguien nombra límites antes o durante la intimidad, yo…","boundaries","critical_ordinal",1.25,true,true],
  ["SI-04","sexuality","Seguridad y ternura","Para sentirme cómodo/a en la intimidad necesito…","sex_pace","ordinal_distance",1,false,true],
  ["SI-05","sexuality","Desajuste de deseo","Si aparece una diferencia de ritmo o deseo, yo…","desire_mismatch","ordinal_distance",1.1,false,true],
  ["SI-06","sexuality","Comunicación sexual","Cuando algo me gusta o no me gusta en la intimidad, suelo…","sex_talk","critical_ordinal",1.15,true,true],

  ["ET-01","trust","Estructura relacional","Sobre exclusividad/monogamia, lo que más se parece a mí es…","exclusivity","critical_ordinal",1.35,true,true],
  ["ET-02","trust","Hablar de acuerdos","Si hay conexión y aún no hay acuerdo de exclusividad, yo…","clarity","critical_ordinal",1.15,true],
  ["ET-03","trust","Contacto con ex","Si la otra persona mantiene contacto con una expareja, yo…","ex_boundaries","ordinal_distance",1,false,true],
  ["ET-04","trust","Privacidad digital","Respecto al móvil, redes y privacidad, yo…","privacy_phone","critical_ordinal",1.1,true,true],
  ["ET-05","trust","Celos","Cuando aparece celos o inseguridad, mi tendencia es…","jealousy","ordinal_distance",1.05,false,true],
  ["ET-06","trust","Transparencia","Para sentir confianza, necesito…","privacy_phone","ordinal_distance",1,false,true],

  ["CU-01","care","Cuidado bajo estrés","Si la otra persona está pasando un día difícil, yo suelo…","care_stress","categorical_matrix",1.1,false,false,"care","care_request","give"],
  ["CU-02","care","Cómo recibir cuidado","Cuando yo estoy mal, lo que más me ayuda es…","care_need","categorical_matrix",1.1,false,false,"care","care_request","need"],
  ["CU-03","care","Aprecio","Cuando valoro a alguien, suelo demostrarlo con…","appreciation","categorical_matrix",0.95,false,false,"appreciation","appreciation","give"],
  ["CU-04","care","Sentirse valorado","Para sentirme apreciado/a, necesito sobre todo…","appreciation","categorical_matrix",0.95,false,false,"appreciation","appreciation","need"],
  ["CU-05","care","Pedir apoyo","Si necesito apoyo y me da miedo cargar, yo…","needs_expression","ordinal_distance",1],
  ["CU-06","care","Reciprocidad","Cuando siento que doy más de lo que recibo, yo…","communication_discomfort","categorical_matrix",1.05,false,false,"directness"],

  ["VC-01","daily","Dinero","Respecto al dinero en pareja o citas, yo…","money","ordinal_distance",1],
  ["VC-02","daily","Orden","En espacios compartidos, mi necesidad de orden es…","order","ordinal_distance",0.85],
  ["VC-03","daily","Móvil y presencia","Cuando estoy con alguien que me gusta, el móvil debería…","phone","ordinal_distance",0.9],
  ["VC-04","daily","Rutina","Mi forma ideal de organizar semanas y planes es…","routine","ordinal_distance",0.85],
  ["VC-05","daily","Social/descanso","Mi energía cotidiana necesita…","space","ordinal_distance",0.75],
  ["VC-06","daily","Negociación cotidiana","Cuando tenemos preferencias prácticas distintas, yo…","adaptability","ordinal_distance",0.95],

  ["PV-01","future","Relación estable","En los próximos 12 meses, una relación estable para mí es…","intent","critical_ordinal",1.25,true],
  ["PV-02","future","Convivencia","Respecto a convivir en algún momento, yo…","cohabitation","critical_ordinal",1.15,true],
  ["PV-03","future","Hijos","Respecto a tener hijos o contemplarlos, yo…","children","critical_ordinal",1.35,true,true],
  ["PV-04","future","Geografía","Cambiar de ciudad/país por una relación me parece…","mobility","critical_ordinal",1.05,true],
  ["PV-05","future","Carrera/proyecto","Ahora mismo, mi carrera o proyecto personal ocupa…","career","ordinal_distance",1],
  ["PV-06","future","Familia","Respecto a integrar familia y pareja, yo…","family","ordinal_distance",0.85],

  ["JA-01","play","Humor bajo tensión","Cuando hay tensión, el humor para mí…","humor_tension","categorical_matrix",0.7,false,false,"humor"],
  ["JA-02","play","Crecimiento compartido","Una relación que me atrae debería…","growth","ordinal_distance",0.75],
  ["JA-03","play","Éxito del otro","Cuando alguien que me gusta brilla o consigue algo, yo…","success","ordinal_distance",0.75],
  ["JA-04","play","Diferencias de intereses","Si tenemos gustos muy distintos, yo…","adaptability","ordinal_distance",0.65],
  ["JA-05","play","Juego y coqueteo","Para mí, el juego/coqueteo cotidiano…","pace","ordinal_distance",0.65],
  ["JA-06","play","Curiosidad por el mundo del otro","Cuando alguien tiene un mundo diferente al mío, yo…","growth","ordinal_distance",0.65],

  ["DX-SI-01","sexuality","Diagnóstico: contacto público","Con muestras físicas de afecto en público, yo…","boundaries","ordinal_distance",0.75,false,true,null,null,null,true],
  ["DX-SI-02","sexuality","Diagnóstico: iniciativa explícita","Si la otra persona toma iniciativa física de forma clara, yo…","initiation","categorical_matrix",0.8,false,true,"initiation",null,null,true],
  ["DX-SI-03","sexuality","Diagnóstico: vergüenza sexual","Cuando hay que decir que algo no apetece, yo…","sex_talk","critical_ordinal",1,true,true,null,null,null,true],
  ["DX-SI-04","sexuality","Diagnóstico: ternura/deseo","Para que el deseo se mantenga, necesito…","attraction_growth","ordinal_distance",0.8,false,true,null,null,null,true],
  ["DX-SI-05","sexuality","Diagnóstico: presión","Si noto prisa física o sexual, yo…","sex_pace","critical_ordinal",1.05,true,true,null,null,null,true],
  ["DX-SI-06","sexuality","Diagnóstico: después de intimidad","Después de un momento íntimo, me sienta mejor…","care_need","categorical_matrix",0.75,false,true,"care",null,null,true],

  ["DX-ET-01","trust","Diagnóstico: límites con terceros","Si alguien coquetea con mi persona delante de mí, yo…","jealousy","ordinal_distance",0.85,false,true,null,null,null,true],
  ["DX-ET-02","trust","Diagnóstico: definir exclusividad","La conversación de exclusividad debería aparecer…","clarity","critical_ordinal",1.05,true,true,null,null,null,true],
  ["DX-ET-03","trust","Diagnóstico: redes sociales","Sobre likes, mensajes y redes sociales, yo…","privacy_phone","ordinal_distance",0.8,false,true,null,null,null,true],
  ["DX-ET-04","trust","Diagnóstico: relación abierta/flexible","Si la otra persona propone no exclusividad consensuada, yo…","exclusivity","critical_ordinal",1.25,true,true,null,null,null,true],
  ["DX-ET-05","trust","Diagnóstico: privacidad individual","Si mi pareja pide privacidad con su móvil, yo…","privacy_phone","critical_ordinal",0.95,true,true,null,null,null,true],
  ["DX-ET-06","trust","Diagnóstico: ex cercana","Si una expareja sigue siendo muy cercana, yo…","ex_boundaries","critical_ordinal",1,true,true,null,null,null,true],

  ["DX-VC-01","daily","Diagnóstico: gastos compartidos","Si una cita o viaje cuesta bastante, yo…","money","ordinal_distance",0.9,false,false,null,null,null,true],
  ["DX-VC-02","daily","Diagnóstico: etapa económica caótica","Si la otra persona tiene una etapa económica caótica, yo…","money","ordinal_distance",0.95,false,false,null,null,null,true],
  ["DX-VC-03","daily","Diagnóstico: convivencia y tareas","Si convivimos o viajamos, las tareas deberían…","order","ordinal_distance",0.9,false,false,null,null,null,true],
  ["DX-VC-04","daily","Diagnóstico: puntualidad","Si la otra persona suele llegar tarde, yo…","plan_change","ordinal_distance",0.75,false,false,null,null,null,true],
  ["DX-VC-05","daily","Diagnóstico: pantallas","Si estamos juntos y la otra persona usa mucho el móvil, yo…","phone","ordinal_distance",0.85,false,false,null,null,null,true],
  ["DX-VC-06","daily","Diagnóstico: improvisación","Si una semana cambia de planes continuamente, yo…","routine","ordinal_distance",0.8,false,false,null,null,null,true],

  ["DX-PV-01","future","Diagnóstico: horizonte de relación","Si tras unos meses todo va bien, yo necesitaría…","clarity","critical_ordinal",1.05,true,false,null,null,null,true],
  ["DX-PV-02","future","Diagnóstico: hijos y tiempos","Si el tema hijos aparece, prefiero…","children","critical_ordinal",1.25,true,true,null,null,null,true],
  ["DX-PV-03","future","Diagnóstico: convivencia temprana","Si la conexión es fuerte, convivir pronto me parecería…","cohabitation","critical_ordinal",0.95,true,false,null,null,null,true],
  ["DX-PV-04","future","Diagnóstico: mudanza","Si vivir cerca exige mudanza de alguien, yo…","mobility","critical_ordinal",1,true,false,null,null,null,true],
  ["DX-PV-05","future","Diagnóstico: familia intensa","Si la familia de la otra persona tiene mucha presencia, yo…","family","ordinal_distance",0.85,false,false,null,null,null,true],
  ["DX-PV-06","future","Diagnóstico: carrera y pareja","Si mi proyecto profesional entra en tensión con la relación, yo…","career","ordinal_distance",1,false,false,null,null,null,true]
];

export const QUESTIONS = SPECS.map(buildQuestion);

export const TEST_MODES = {
  quick: {
    id: "quick",
    label: "Rápido",
    description: "36 preguntas, 3 por dimensión. Para probar sin fatiga.",
    questionIds: DIMENSIONS.flatMap(d => QUESTIONS.filter(q => q.dimensionId === d.id && !q.diagnostic).slice(0, 3).map(q => q.id))
  },
  balanced: {
    id: "balanced",
    label: "Equilibrado",
    description: "72 preguntas, 6 por dimensión. Recomendado.",
    questionIds: QUESTIONS.filter(q => !q.diagnostic).map(q => q.id)
  },
  adaptive: {
    id: "adaptive",
    label: "Adaptativo",
    description: "Empieza con 72 preguntas y propone extras solo si detecta zonas sensibles.",
    questionIds: QUESTIONS.filter(q => !q.diagnostic).map(q => q.id)
  },
  full: {
    id: "full",
    label: "Completo",
    description: "96 preguntas. Añade diagnósticos en intimidad, límites, vida cotidiana y futuro.",
    questionIds: QUESTIONS.map(q => q.id)
  }
};

export function getQuestionsForMode(mode = "balanced") {
  const selected = TEST_MODES[mode] || TEST_MODES.balanced;
  const set = new Set(selected.questionIds);
  return QUESTIONS.filter(q => set.has(q.id));
}

export function getQuestionById(id) {
  return QUESTIONS.find(q => q.id === id);
}
