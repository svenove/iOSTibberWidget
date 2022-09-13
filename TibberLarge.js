// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: cyan; icon-glyph: bolt;
// Tibber-widget
// v1.0.0 - første versjon - Sven-Ove Bjerkan
// v1.0.1 - Lagt til "HOME_NR" som innstilling
// v1.5.0 - Laget medium- og large-størrelse widget (foreløpig som 3 separate script)
// v2.0.0 - Viser 3 timer bakover og inntil 21 timer fremover (konfigurerbart)
// v2.0.1 - Mulighet for å legge til nettleie
// v2.0.2 - småfiks på fontfarger, o.l
// v2.0.3 - Uploaded to GitHub by Daniel Eneström (https://github.com/danielenestrom)
// v2.0.4 - avrunder pris til hele øre. Trinn-graf. 

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

// Angi hvor mange timer bakover og fremover fra inneværende time den skal bruke
const TIMER_BAKOVER = 3;
const TIMER_FREMOVER = 21;

// Skal nettleie legges til i beløpene?
const NETTLEIE = false; // (true eller false)
const NETT_FAST = 198; // I kroner pr mnd
const NETT_KWH = 35.51; // I øre pr kWh, med punktum som desimaltegn


// Angi størrelsen på grafen
const GRAPH_WIDTH = 2400;
const GRAPH_HEIGHT = 1200;





// DU TRENGER IKKE ENDRE NOE LENGRE NED !
// --------------------------------------

// GraphQL-spørring
let body = {
  "query": "{ \
    viewer { \
      homes { \
        currentSubscription { \
          priceRating { \
            hourly { \
              entries { \
                total \
                time \
              } \
            } \
          } \
        } \
        dayConsumption: consumption (resolution: HOURLY, last: " + new Date().getHours() + ") { \
          pageInfo { \
            totalConsumption \
            totalCost \
          } \
        } \
        monthConsumption: consumption (resolution: DAILY, last: " + (new Date().getDate()-1) + ") { \
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

// Array med alle timepriser
let allPrices = json["data"]["viewer"]["homes"][HOME_NR]["currentSubscription"]["priceRating"]["hourly"]["entries"]

// Date-objekt for akkurat denne timen
let d = new Date();
d.setMinutes(0)
d.setSeconds(0)
d.setMilliseconds(0)//

// Loop for å finne array-key for inneværende time
let iNow, iStart, iEnd, dLoop
for (let i = 0; i < allPrices.length; i++) {
 dLoop = new Date(allPrices[i].time)
 if (d.getTime() == dLoop.getTime()) {
   iNow = i
   iStart = (iNow-TIMER_BAKOVER)
   iEnd = (iNow + TIMER_FREMOVER)
   if (iEnd > allPrices.length) {
	   iEnd = (allPrices.length-1)
   }
   break;
  }
}

// Loop for å finne snittpris
let avgPrice = 0
let minPrice = 100000
let maxPrice = 0
let prices = [];
let colors = [];
let pointsize = [];

// Finn neste midnatt
d.setHours(0);
d.setDate(d.getDate()+1)

for (let i = iStart; i <= iEnd; i++) {
  if (NETTLEIE) {
    allPrices[i].total = allPrices[i].total+(NETT_KWH/100);
  }
  avgPrice += allPrices[i].total
  prices.push(Math.round(allPrices[i].total * 100));

  if (allPrices[i].total * 100 < minPrice)
    minPrice = Math.round(allPrices[i].total * 100)
   if (allPrices[i].total * 100 > maxPrice)
     maxPrice = Math.round(allPrices[i].total * 100)

  if (i == iNow) {
  	colors.push("'yellow'");
    pointsize.push(20);
  }
  else if (d.getTime() == new Date(allPrices[i].time).getTime()) {
    colors.push("'cyan'");
    pointsize.push(20);
  }
  else {
    colors.push("'cyan'");
    pointsize.push(7);
  }
}
avgPrice = Math.round(avgPrice / (prices.length) * 100)

// Loop for å lage strek for snittprisen
let dTemp
let avgPrices = []
let labels = []
for (let i = iStart; i <= iEnd; i++) {
  avgPrices.push(avgPrice);
  dTemp = new Date(allPrices[i].time)
  let hours = dTemp.getHours();
  if (hours < 10)
    hours = "0"+hours;
  labels.push("'" + hours + "'");
}

let url = "https://quickchart.io/chart?w="+ GRAPH_WIDTH + "&h=" + GRAPH_HEIGHT + "&devicePixelRatio=1.0&c="
url += encodeURI("{ \
   type:'line', \
   data:{ \
      labels:[ \
         " + labels + " \
      ], \
      datasets:[ \
         { \
            label:'Øre pr kWh', \
            steppedLine:true, \
            data:[ \
               " + prices + " \
            ], \
            fill:false, \
            borderColor:'cyan', \
            borderWidth: 7, \
            pointBackgroundColor:[ \
               " + colors + " \
            ], \
            pointRadius:[ \
               " + pointsize + " \
            ] \
         }, \
         { \
            label:'Snitt (" + avgPrice + " øre)', \
            data:[ \
               " + avgPrices + " \
            ], \
            fill:false, \
            borderColor:'red', \
            borderWidth: 7, \
            pointRadius: 0 \
         } \
      ] \
   }, \
   options:{ \
      legend:{ \
         labels:{ \
            fontSize:90, \
            fontColor:'white' \
         } \
      }, \
      scales:{ \
         yAxes:[ \
            { \
               ticks:{ \
                  beginAtZero:false, \
                  fontSize:100, \
                  fontColor:'white' \
               } \
            } \
         ], \
         xAxes:[ \
            { \
               ticks:{ \
                  fontSize:60, \
                  fontColor:'white' \
               } \
            } \
         ] \
      } \
   } \
}")

const GRAPH = await new Request(url).loadImage()


// Hent ut totalt forbruk/kostnad hittil i dag
let totCostD = Math.round(json["data"]["viewer"]["homes"][HOME_NR]["dayConsumption"]["pageInfo"]["totalCost"])
let totForbrukD = Math.round(json["data"]["viewer"]["homes"][HOME_NR]["dayConsumption"]["pageInfo"]["totalConsumption"])
// Hent ut totalt forbruk/kostnad hittil denne mnd
let totCostM = Math.round(json["data"]["viewer"]["homes"][HOME_NR]["monthConsumption"]["pageInfo"]["totalCost"]) + totCostD
let totForbrukM = Math.round(json["data"]["viewer"]["homes"][HOME_NR]["monthConsumption"]["pageInfo"]["totalConsumption"]) + totForbrukD

// Legg til nettleie i dagssummen?
if (NETTLEIE) {
	totCostD += NETT_FAST/new Date(d.getYear(), d.getMonth()+1, 0).getDate();
	totCostD += totForbrukD*(NETT_KWH/100);
	totCostD = Math.round(totCostD);
}

// Legg til nettleie i månedssummen?
if (NETTLEIE) {
	totCostM += NETT_FAST;
	totCostM += totForbrukM*(NETT_KWH/100);
	totCostM = Math.round(totCostM);
}

// Hent ut pris i øre for inneværende time
let priceOre = Math.round(allPrices[iNow].total * 100)

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
  stack.addSpacer(100)
  let imgstack = stack.addImage(TIBBERLOGO)
  imgstack.imageSize = new Size(100, 30)
  imgstack.centerAlignImage()
  stack.setPadding(0, 0, 5, 0)

  if (NETTLEIE) {
    let txtStack = lw.addStack();
    txtStack.addSpacer(100);
    let txtNett = txtStack.addText("Alle beløp inkl nettleie");
    txtNett.centerAlignText();
    txtNett.font = Font.lightSystemFont(10);
  }

  lw.addSpacer(10);

  let stack2 = lw.addStack()

  // Venstre kolonne
  let stackV = stack2.addStack();
  stackV.layoutVertically()
  stackV.centerAlignContent()
  stackV.setPadding(0, 30, 0, 0)

  // Legg til inneværende pris i v.kolonne
  let price = stackV.addText(priceOre + "");
  price.centerAlignText();
  price.font = Font.lightSystemFont(20);
  // Pris høyere eller lavere enn snitt avgjør farge
  if (priceOre < avgPrice)
    price.textColor = new Color(TEXTFARGE_LAV)
  else if (priceOre > avgPrice)
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
  stack2.addSpacer(40)

  // Midtre kolonne
  let stackM = stack2.addStack();
  stackM.layoutVertically()

  // Legg til forbruk hittil i dag i m.kolonne
  let forbruk = stackM.addText(totCostD + " kr");
  forbruk.rightAlignText();
  forbruk.font = Font.lightSystemFont(16);
  forbruk.textColor = new Color(TEKSTFARGE);

  let forbruk2 = stackM.addText(totForbrukD + " kWh");
  forbruk2.rightAlignText();
  forbruk2.font = Font.lightSystemFont(14);
  forbruk2.textColor = new Color(TEKSTFARGE);

  let forbrukTxt = stackM.addText("Hittil i dag");
  forbrukTxt.rightAlignText();
  forbrukTxt.font = Font.lightSystemFont(10);
  forbrukTxt.textColor = new Color(TEKSTFARGE);

  // Avstand mellom kolonnene
  stack2.addSpacer(40)

  // Høyre kolonne
  let stackH = stack2.addStack();
  stackH.layoutVertically()

  // Legg til forbruk hittil denne mnd i h.kolonne
  forbruk = stackH.addText(totCostM + " kr");
  forbruk.rightAlignText();
  forbruk.font = Font.lightSystemFont(16);
  forbruk.textColor = new Color(TEKSTFARGE);

  forbruk2 = stackH.addText(totForbrukM + " kWh");
  forbruk2.rightAlignText();
  forbruk2.font = Font.lightSystemFont(14);
  forbruk2.textColor = new Color(TEKSTFARGE);

  forbrukTxt = stackH.addText("Hittil denne mnd");
  forbrukTxt.rightAlignText();
  forbrukTxt.font = Font.lightSystemFont(10);
  forbrukTxt.textColor = new Color(TEKSTFARGE);


  // Avstand ned til grafen
  lw.addSpacer(25)


  graphTxt = lw.addText("Timepriser");
  graphTxt.centerAlignText();
  graphTxt.font = Font.lightSystemFont(16);
  graphTxt.textColor = new Color(TEKSTFARGE);

  lw.addSpacer(10)

  let stackGraph = lw.addStack()
  let imgstack2 = stackGraph.addImage(GRAPH)
  imgstack2.imageSize = new Size(300, 150)
  imgstack2.centerAlignImage()
  stackGraph.setPadding(0, 0, 0, 0)


  // Avstand ned til bunntekst
  lw.addSpacer(20)


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
  widget.presentLarge();
}
Script.complete();
