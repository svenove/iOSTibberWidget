// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: cyan; icon-glyph: bolt;
// Tibber-widget
// v1.0.0 - første versjon - Sven-Ove Bjerkan
// v1.0.1 - Lagt til "HOME_NR" som innstilling
// v1.5.0 - Laget medium- og large-størrelse widget (foreløpig som 3 separate script)
// v1.5.1 - Uploaded to GitHub by Daniel Eneström (https://github.com/danielenestrom)

// Finn din token ved å logge på med Tibber-kontoen din her:
// https://developer.tibber.com/settings/accesstoken
// OBS! Din token er privat, ikke del den med noen!
const TIBBERTOKEN = "476c477d8a039529478ebd690d35ddd80e3308ffc49b59c65b142321aee963a4";

// I de fleste tilfeller skal HOME_NR være 0, men om man har flere abonnement (hus+hytte f.eks)
// så kan det være at man må endre den til 1 (eller 2). 
// Prøv 0 først og om det kommer feilmelding, prøv med 1 (og deretter 2).
const HOME_NR = 0;

// HTML-koden for bakgrunnsfarge på widget (#000000 er svart)
const BAKGRUNNSFARGE = "#000000";

// HTML-koden for tekstfarge (#FFFFFF er hvit)
const TEKSTFARGE = "#FFFFFF";

// Når prisen denne timen er høyere enn snittprisen i dag, så brukes denne tekstfargen (rød)
const TEXTFARGE_HOY = "#de4035";

// Når prisen denne timen er lavere enn snittprisen i dag, så brukes denne tekstfargen (grønn)
const TEXTFARGE_LAV = "#35de3b";




// DU TRENGER IKKE ENDRE NOE LENGRE NED !
// --------------------------------------

// GraphQL-spørring
let body = {
  "query": "{ \
    viewer { \
      homes { \
        currentSubscription { \
          priceInfo { \
            current { \
              total \
            } \
            today { \
              total \
            } \
          } \
        } \
        consumption (resolution: HOURLY, last: " + new Date().getHours() + ") { \
          pageInfo { \
            totalConsumption \
            totalCost \
          } \
        } \
      } \
    } \
  }"
}

let req = new Request("https://api.tibber.com/v1-beta/gql")
req.headers = {
  "Authorization": "Bearer " + TIBBERTOKEN,
  "Content-Type": "application/json"
}
req.body = JSON.stringify(body)
req.method = "POST";
let json = await req.loadJSON()

// Array med alle dagens timepriser
let allToday = json["data"]["viewer"]["homes"][HOME_NR]["currentSubscription"]["priceInfo"]["today"]

// Loop igjennom alle dagens timepriser for å finne min/max/snitt
let minPrice = 100000
let maxPrice = 0
let avgPrice = 0
for (var i = 0; i < allToday.length; i++) {
  if (allToday[i].total * 100 < minPrice)
    minPrice = Math.round(allToday[i].total * 100)
  if (allToday[i].total * 100 > maxPrice)
    maxPrice = Math.round(allToday[i].total * 100)
  avgPrice += allToday[i].total
}
avgPrice = avgPrice / allToday.length * 100

// Hent ut totalt forbruk/kostnad hittil i dag
let totCost = Math.round(json["data"]["viewer"]["homes"][HOME_NR]["consumption"]["pageInfo"]["totalCost"])
let totForbruk = Math.round(json["data"]["viewer"]["homes"][HOME_NR]["consumption"]["pageInfo"]["totalConsumption"])

// Hent ut pris i kroner for inneværende time
let price = (json["data"]["viewer"]["homes"][HOME_NR]["currentSubscription"]["priceInfo"]["current"]["total"]);

// Omregn til øre
let priceOre = Math.round(price * 100)

// Hent Tibber-logoen
const TIBBERLOGO = await new Request("https://tibber.imgix.net/zq85bj8o2ot3/6FJ8FvW8CrwUdUu2Uqt2Ns/3cc8696405a42cb33b633d2399969f53/tibber_logo_blue_w1000.png").loadImage()


// Opprett widget
async function createWidget() {
  // Create new empty ListWidget instance
  let lw = new ListWidget();

  // Set new background color
  lw.backgroundColor = new Color(BAKGRUNNSFARGE);

  // Man kan ikke styre når widget henter ny pris
  // men, prøver her å be widget oppdatere seg etter 1 min over neste time
  var d = new Date();
  d.setHours(d.getHours() + 1);
  d.setMinutes(1);
  lw.refreshAfterDate = d;

  // Legg til Tibber-logo i en egen stack
  let stack = lw.addStack()
  stack.addSpacer(12)
  let imgstack = stack.addImage(TIBBERLOGO)
  imgstack.imageSize = new Size(100, 30)
  imgstack.centerAlignImage()
  stack.setPadding(0, 0, 25, 0)

  let stack2 = lw.addStack()

  // Venstre kolonne
  let stackV = stack2.addStack();
  stackV.layoutVertically()
  stackV.centerAlignContent()
  stackV.setPadding(0, 10, 0, 0)

  // Legg til inneværende pris i v.kolonne
  let price = stackV.addText(priceOre + "");
  price.centerAlignText();
  price.font = Font.lightSystemFont(20);
  // Pris høyere eller lavere enn snitt avgjør farge
  if (priceOre < avgPrice)
    price.textColor = new Color(TEXTFARGE_LAV)
  if (priceOre > avgPrice)
    price.textColor = new Color(TEXTFARGE_HOY)

  const priceTxt = stackV.addText("øre/kWh");
  priceTxt.centerAlignText();
  priceTxt.font = Font.lightSystemFont(10);
  priceTxt.textColor = new Color(TEKSTFARGE);

  // Legg til dagens "max | min"-timespris
  let maxmin = stackV.addText(minPrice + " | " + maxPrice)
  maxmin.centerAlignText()
  maxmin.font = Font.lightSystemFont(10);
  maxmin.textColor = new Color(TEKSTFARGE);

  // Avstand mellom kolonnene
  stack2.addSpacer(20)

  // Høyre kolonne
  let stackH = stack2.addStack();
  stackH.layoutVertically()

  // Legg til forbruk hittil i dag i h.kolonne
  let forbruk = stackH.addText(totCost + " kr");
  forbruk.rightAlignText();
  forbruk.font = Font.lightSystemFont(16);
  forbruk.textColor = new Color(TEKSTFARGE);

  let forbruk2 = stackH.addText(totForbruk + " kWh");
  forbruk2.rightAlignText();
  forbruk2.font = Font.lightSystemFont(14);
  forbruk2.textColor = new Color(TEKSTFARGE);

  let forbrukTxt = stackH.addText("Hittil i dag");
  forbrukTxt.rightAlignText();
  forbrukTxt.font = Font.lightSystemFont(10);
  forbrukTxt.textColor = new Color(TEKSTFARGE);

  // Avstand ned til bunntekst
  lw.addSpacer(30)

  // Legg til info om når widget sist hentet prisen
  d = new Date()
  let hour = d.getHours();

  // Omgjør til formatet HH:mm
  if (hour < 10) hour = "0" + hour;
  let min = d.getMinutes();
  if (min < 10) min = "0" + min;

  let time = lw.addText("Oppdatert: " + hour + ":" + min);
  time.centerAlignText();
  time.font = Font.lightSystemFont(8);
  time.textColor = new Color(TEKSTFARGE);

  // Return the created widget
  return lw;
}

let widget = await createWidget();

// Check where the script is running
if (config.runsInWidget) {
  // Runs inside a widget so add it to the homescreen widget
  Script.setWidget(widget);
} else {
  // Show the medium widget inside the app
  widget.presentSmall();
}
Script.complete();