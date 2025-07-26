/*Allows users to browse different help categories and contact support.
 */
import React, { useState } from 'react';
import './Help.css'; 

const Help = () => {
  // State to track the currently active FAQ category and default to 'general'
  const [activeCategory, setActiveCategory] = useState('algemeen'); 

  
  const faqCategories = {
    algemeen: [ 
      {
      
        question: "Wat is de Hooikoorts App?",
        answer: "De Hooikoorts App is effectief voor mensen die hevig last hebben van hooikoorts. Je krijgt gewoon live updates over pollen, het weer en zelfs wat persoonlijk advies (alsof je een mini-coach op zak hebt). Zo weet je precies wanneer je beter binnen kunt blijven of juist naar buiten kunt zonder dat je meteen begint te niezen. Scheelt weer gedoe met snotneuzen en je kunt je dag gewoon wat beter plannen"
      },
      {
       question: "Hoe werkt die app nou eigenlijk?",
        answer: " Simpel: de app checkt automatisch waar je bent en laat zien hoeveel pollen er in de lucht zweven en wat het weer doet. Jij geeft zelf aan voor welke pollen je gevoelig bent – graspollen, boompollen, you name it – en dan krijg je advies op maat. Je kunt zelfs terugkijken hoe het de afgelopen dagen was en bijhouden hoe erg je klachten waren. Superhandig, toch?"
      }
    ],
    pollen: [
      {
        question: "Wat moet ik me voorstellen bij die pollenconcentraties?",
        answer: "Die pollenconcentraties, trouwens, zijn niet gewoon vaag: je ziet meteen d.m.v. API's kleur of je in het groen (zeer laag), lichtgroen (laag), geel (middelhoog), oranje (hoog) of rood (zeer hoog) zit. Lekker duidelijk dus. Zo weet je snel of je zakdoeken moet hamsteren of dat het allemaal wel meevalt vandaag"
      },
      {
        question: "Welke pollen-soorten checkt de app eigenlijk allemaal?",
        answer: "De app meet drie hoofdsoorten pollen: Graspollen, Boompollen en Onkruidpollen. Elk type pollen kent een specifiek seizoen en kan uiteenlopende symptomen veroorzaken. Je kunt in je voorkeuren aangeven welke pollen je het meest beïnvloeden."
      }
    ],
    voorkeuren: [
      {
        question: "Hoe stel ik mijn voorkeuren in in deze hooikoorts API's?",
        answer: "Ga naar het voorkeurenmenu en selecteer de pollen waar je gevoelig voor bent. Je kunt ook je medicatie instellen en aangeven of je een luchtbevochtiger gebruikt. Deze instellingen worden gebruikt om je persoonlijke advies te genereren."
      },
      {
        question: "Kan ik gewoon mijn voorkeuren aanpassen?",
        answer: "Tuurlijk kun je je voorkeuren veranderen. Gewoon even naar het voorkeurenmenu gaan, instellingen aanpassen en hoppa – jouw advies wordt gelijk bijgewerkt. Geen gedoe, gewoon doen"
      } 
    ],
    klachten: [
      {
        question: "Hoe houd ik mijn klachten bij?",
        answer: "Je kunt je klachten bijhouden via het klachtenmenu. Selecteer de ernst van je symptomen en voeg eventueel een notitie toe. De app houdt een overzicht bij van je klachtenpatroon, wat kan helpen bij het bespreken met je arts."
      },
      {
        question: "Wat moet je doen als je klachten echt niet te harden zijn?",
        answer: "Mocht je echt knettergek worden van je klachten: ga dan gewoon even langs de huisarts, hè. De app is tof, maar geen dokter. Zie het gewoon als een extra tool om wat grip te krijgen op al dat niezen en snotteren."
      }
    ]
  };

  return (
    <div className="help-container">
      <h1>Help & Veelgestelde Vragen</h1> 
      
      {/* Category selection buttons */}
      <div className="help-categories">
        <button 
          className={activeCategory === 'algemeen' ? 'active' : ''} 
          onClick={() => setActiveCategory('algemeen')}
        >
          Algemeen 
        </button>
        <button 
          className={activeCategory === 'pollen' ? 'active' : ''} 
          onClick={() => setActiveCategory('pollen')}
        >
          Pollen 
        </button>
        <button 
          className={activeCategory === 'voorkeuren' ? 'active' : ''} 
          onClick={() => setActiveCategory('voorkeuren')}
        >
          Voorkeuren 
        </button>
        <button 
          className={activeCategory === 'klachten' ? 'active' : ''} 
          onClick={() => setActiveCategory('klachten')}
        >
          Klachten 
        </button>
      </div>

      {/* FAQ list for the active category */}
      <div className="faq-list">
        {faqCategories[activeCategory].map((faq, index) => (
          <div key={index} className="faq-item">
            <h3>{faq.question}</h3>
            <p>{faq.answer}</p>
          </div>
        ))}
      </div>

      {/* Contact section */}
      <div className="help-contact">
        <h2>Nog vragen?</h2> 
        <p>Staat je vraag er niet tussen? Gooi ‘m gerust onze kant op via:</p>
        <a href="mailto:michael.barak@novi-education.nl" className="contact-button">
          Stuur een e-mail
        </a>
      </div>
    </div>
  );
};

export default Help;