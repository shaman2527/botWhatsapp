const { createBot, createProvider, createFlow, addKeyword, EVENTS, addAnswer } = require('@bot-whatsapp/bot')
require("dotenv").config

const QRPortalWeb = require('@bot-whatsapp/portal')
const BaileysProvider = require('@bot-whatsapp/provider/baileys')
// const MockAdapter = require('@bot-whatsapp/database/mock')
const MongoAdapter = require('@bot-whatsapp/database/mongo')
const path = require("path")
const fs = require("fs")
const chat = require("./chatGPT")
const { handlerAI } = require("./whisper")
const { addAbortSignal } = require('stream')

const menuPath = path.join(__dirname, "mensajes", "menu.txt")
const menu = fs.readFileSync(menuPath, "utf8")

const pathConsultas = path.join(__dirname, "mensajes", "promptConsultas.txt")
const promptConsultas = fs.readFileSync(pathConsultas, "utf8")

const flowVoice = addKeyword(EVENTS.VOICE_NOTE).addAnswer("Esta es una nota de voz", null, async (ctx, ctxFn) => {
    const text = await handlerAI(ctx)
    const prompt = promptConsultas
    const consulta = text
    const answer = await chat(prompt, consulta)
    await ctxFn.flowDynamic(answer.content)
    console.log(answer.content);
})



const flowMenuRest = addKeyword(EVENTS.ACTION)
    .addAnswer('Este es el menu', {
        media: "https://www.ujamaaresort.org/wp-content/uploads/2018/01/Ujamaa-restaurant-menu.pdf"
    })

const flowReservar = addKeyword(EVENTS.ACTION)
    .addAnswer('Este es el flow reservas: ww.hacetureserva.com')


const flowConsultas = addKeyword(EVENTS.ACTION)
    .addAnswer('Este es el flow consultas')
    .addAnswer("Hace tu consulta", { capture: true }, async (ctx, ctxFn) => {
        const prompt = promptConsultas
        const consulta = ctx.body
        const answer = await chat(prompt, consulta)
        await ctxFn.flowDynamic(answer.content)
    })

const flowHumano = addKeyword(EVENTS.ACTION)
    .addAnswer('Espere breve momento sera atendido por un humano')     


const flowWelcome = addKeyword(EVENTS.WELCOME)
    .addAnswer(["¡Hola dulceros!", 'Bienvenido a CHATBOT WSP', 'Explora nuestro menú: Tenemos de todo para tentar a tu paladar.', '¿Necesitas ayuda? ¡Estamos aquí para ti!', 'Para empezar, escribe (MENU).'], {
        delay: 100,
    },
        // async (ctx, ctxFn) => {
        //     if (ctx.body.includes("Casas")) {
        //         await ctxFn.flowDynamic("Escribiste casas")
        //     } else {
        //         await ctxFn.flowDynamic("Explora nuestro menu tendemos variedad de productos, Estamos en Face Beta Hare Todo lo posible para guiarte SELECCIONA MENU..!")
        //     }
        )

const menuFlow = addKeyword("Menu").addAnswer(
    menu,
    { capture: true },
    async (ctx, { gotoFlow, fallBack, flowDynamic }) => {
        if (!["1", "2", "3", "4", "0"].includes(ctx.body)) {
            return fallBack(
                "Respuesta no válida, por favor selecciona una de las opciones."
            );
        }
        switch (ctx.body) {
            case "1":
                return gotoFlow(flowMenuRest);
            case "2":
                return gotoFlow(flowReservar);
            case "3":
                return gotoFlow(flowConsultas);
             case "4":
               return gotoFlow(flowHumano); 
                
            case "0":
                return await flowDynamic(
                    "Saliendo... Puedes volver a acceder a este menú escribiendo '*Menu*'"
                );
        }
        
    }
);


// let nombre = ""
// let apellidos = ""
// let telefono = 0

// const flow1 = addKeyword(['Hola', '⬅️ Volver al Inicio'])
//   .addAnswer(
//     ['Hola!', 'Para enviar el formulario necesito algunos datos...', 'Escriba su *Nombre*'],
//     { capture: true, buttons: [{ body: '❌ Cancelar solicitud' }] },

//     async (ctx, { flowDynamic, endFlow }) => {
//       if (ctx.body === '❌ Cancelar solicitud') {
//         return endFlow({
//           body: '❌ Su solicitud ha sido cancelada ❌',
//           buttons: [{ body: '⬅️ Volver al Inicio' }],
//         });
//       }

//     }
// )
    


const main = async () => {
    const adapterDB = new MongoAdapter({
        dbUri: process.env.MONGO_DB_URI,
        dbName: "YoutubeTest"
    })
const flowFormulario = addKeyword(['Hola', '⬅️ Volver al Inicio'])
    const adapterFlow = createFlow([flowWelcome, menuFlow, flowMenuRest, flowReservar, flowConsultas, flowVoice, flowHumano])
    const adapterProvider = createProvider(BaileysProvider)

    createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    })

    QRPortalWeb()
}

main()
