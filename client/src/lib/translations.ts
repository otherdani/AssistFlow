export type Language = "en" | "hu";

export const translations = {
  en: {
    // General
    language: "Language",
    english: "English",
    hungarian: "Hungarian",
    next: "Next",
    back: "Back",
    complete: "Complete",
    continue: "Continue",
    cancel: "Cancel",
    
    // Customer Form
    customerForm: {
      title: "IT Support Portal",
      subtitle: "Follow these steps to prepare for remote assistance",
      
      // Step 1: Customer Information
      step1Title: "Your Information",
      customerName: "Your Name",
      customerNamePlaceholder: "Enter your full name",
      customerEmail: "Email Address (optional)",
      customerEmailPlaceholder: "your.email@example.com",
      computerInfo: "Computer Information",
      computerInfoPlaceholder: "e.g., Dell Laptop, Windows 11, 8GB RAM",
      issueDescription: "Describe the Issue",
      issueDescriptionPlaceholder: "Please describe what problem you're experiencing...",
      
      // Preparation Steps
      preparationTitle: "Before Starting Support Session",
      step1Prep: "Prepare Your Information",
      step1PrepDesc: "Have your computer model, operating system version, and error details ready.",
      step2Prep: "Close Sensitive Applications",
      step2PrepDesc: "Close any applications containing personal or confidential information.",
      step3Prep: "Ensure Stable Connection",
      step3PrepDesc: "Make sure you have a stable internet connection for the duration of the session.",
      
      // System Requirements
      requirementsTitle: "Microsoft Quick Assist Requirements",
      systemReqTitle: "System Requirements",
      systemReq1: "Windows 10 or Windows 11",
      systemReq2: "Internet connection",
      systemReq3: "Microsoft Account (recommended)",
      systemReq4: "Latest Windows updates",
      
      // Security Features
      securityTitle: "Security Features",
      security1: "End-to-end encryption",
      security2: "Session recording available",
      security3: "Granular permission controls",
      security4: "Automatic session timeout",
      
      // Quick Assist Steps
      quickAssistTitle: "Microsoft Quick Assist Steps",
      qaStep1: "1. Click the Start button, type 'Quick Assist', then select it from the results.",
      qaStep2: "2. If prompted, accept the privacy policy.",
      qaStep3: "3. Enter the Security Code",
      qaStep3Desc: "Enter the code you see above in the 'Security code from helper' field, then select Send. Please check your email for the code if you don't see it on this page.",
      qaStep4: "4. Wait for the devices to connect. This happens automatically once the code is submitted.",
      qaStep4Desc: "Wait for the devices to connect. This happens automatically once the code is submitted.",
      qaStep5: "5. Grant Screen Sharing Permission.",
      
      // Security Code
      securityCodeTitle: "Security Code",
      securityCodeDesc: "Once all steps are completed, your security code will be provided here:",
      securityCodePlaceholder: "Complete all steps to receive your security code",
      
      // Status
      waitingForCode: "Waiting for security code from support team...",
      sessionReady: "Your session is ready! Use the security code above.",
      
      // Completion
      markComplete: "I have completed this step",
    }
  },
  
  hu: {
    // General
    language: "Nyelv",
    english: "Angol",
    hungarian: "Magyar",
    next: "Tovább",
    back: "Vissza",
    complete: "Befejezés",
    continue: "Folytatás",
    cancel: "Mégse",
    
    // Customer Form
    customerForm: {
      title: "IT Támogatási Portál",
      subtitle: "Kövesse ezeket a lépéseket a távoli segítség előkészítéséhez",
      
      // Step 1: Customer Information
      step1Title: "Az Ön adatai",
      customerName: "Az Ön neve",
      customerNamePlaceholder: "Adja meg a teljes nevét",
      customerEmail: "E-mail cím (opcionális)",
      customerEmailPlaceholder: "az.on.email@pelda.hu",
      computerInfo: "Számítógép információk",
      computerInfoPlaceholder: "pl. Dell Laptop, Windows 11, 8GB RAM",
      issueDescription: "Probléma leírása",
      issueDescriptionPlaceholder: "Kérjük, írja le, milyen problémával találkozott...",
      
      // Preparation Steps
      preparationTitle: "Támogatási munkamenet kezdése előtt",
      step1Prep: "Készítse elő az információkat",
      step1PrepDesc: "Készítse elő a számítógép modelljét, operációs rendszer verzióját és a hiba részleteit.",
      step2Prep: "Zárja be az érzékeny alkalmazásokat",
      step2PrepDesc: "Zárja be a személyes vagy bizalmas információkat tartalmazó alkalmazásokat.",
      step3Prep: "Biztosítson stabil kapcsolatot",
      step3PrepDesc: "Győződjön meg róla, hogy stabil internetkapcsolata van a munkamenet időtartamára.",
      
      // System Requirements
      requirementsTitle: "Microsoft Gyors segítség követelmények",
      systemReqTitle: "Rendszerkövetelmények",
      systemReq1: "Windows 10 vagy Windows 11",
      systemReq2: "Internetkapcsolat",
      systemReq3: "Microsoft fiók (ajánlott)",
      systemReq4: "Legfrissebb Windows frissítések",
      
      // Security Title
      securityTitle: "Biztonsági funkciók",
      security1: "Végpontok közötti titkosítás",
      security2: "Munkamenet rögzítése elérhető",
      security3: "Részletes engedélyezési vezérlők",
      security4: "Automatikus munkamenet időkorlát",
      
      // Quick Assist Steps
      quickAssistTitle: "Microsoft Gyors segítség lépései",
      qaStep1: "1. Válassza a Start gombot, írja be a 'Gyors segítség' szöveget, majd válassza ki a találatok listájából.",
      qaStep2: "2. Ha a rendszer arra kéri, fogadja el az adatvédelmi szabályzatot.",
      qaStep3: "3. Biztonsági kód megadása",
      qaStep3Desc: "A 'Biztonsági kód a segédtől' mezőben adja meg a fent látható biztonsági kódot, majd válassza a Küldés lehetőséget. Kérjük, ellenőrizze az e-mailjeit is a kódért, ha nem látja ezen az oldalon.",
      qaStep4: "4. Várakozás a csatlakozásra",
      qaStep4Desc: "Várjon, amíg az eszközök csatlakoznak. Ez automatikusan megtörténik a kód elküldése után.",
      qaStep5: "5. Képernyőmegosztási engedély megadása.",
      
      // Security Code
      securityCodeTitle: "Biztonsági kód",
      securityCodeDesc: "Miután minden lépést befejezett, a biztonsági kód itt lesz megadva:",
      securityCodePlaceholder: "Fejezze be az összes lépést a biztonsági kód megszerzéséhez",
      
      // Status
      waitingForCode: "Várakozás a támogatási csapat biztonsági kódjára...",
      sessionReady: "A munkamenet készen áll! Használja a fenti biztonsági kódot.",
      
      // Completion
      markComplete: "Befejeztem ezt a lépést",
    }
  }
} as const;
