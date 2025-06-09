// Importa la funzione fourPointTransform dalla libreria
// L'URL CDN deve essere l'URL completo del modulo.
import { fourPointTransform } from 'https://cdn.jsdelivr.net/npm/four-point-transform@1.0.1/dist/four-point-transform.min.js';

document.addEventListener('DOMContentLoaded', () => {
    const inputImage = document.getElementById('inputImage');
    const message = document.getElementById('message');
    const originalCanvas = document.getElementById('originalCanvas');
    const ctxOriginal = originalCanvas.getContext('2d');
    const controls = document.getElementById('controls');
    const pointsCountSpan = document.getElementById('pointsCount');
    const resetPointsBtn = document.getElementById('resetPointsBtn');
    const straightenBtn = document.getElementById('straightenBtn');
    const outputSection = document.getElementById('outputSection'); 
    const straightenedCanvas = document.getElementById('straightenedCanvas');
    const ctxStraightened = straightenedCanvas.getContext('2d');
    const downloadBtn = document.getElementById('downloadBtn');

    let currentImage = null; // L'oggetto immagine caricato
    let selectedPoints = []; // Array per memorizzare i punti [x, y] selezionati
    const POINT_RADIUS = 5; // Raggio per disegnare i punti

    // Non serve più il controllo typeof fourPointTransform === 'function' qui
    // perché l'import fallirebbe se non la trovasse.
    console.log("Libreria 'four-point-transform' importata con successo.");
    

    // --- Funzioni di utilità ---

    // Funzione per disegnare l'immagine originale e i punti selezionati
    const drawImageAndPoints = () => {
        if (!currentImage) {
            console.log("Nessuna immagine corrente da disegnare.");
            return;
        }

        // Imposta le dimensioni del canvas uguali a quelle dell'immagine originale
        originalCanvas.width = currentImage.width;
        originalCanvas.height = currentImage.height;

        ctxOriginal.clearRect(0, 0, originalCanvas.width, originalCanvas.height);
        ctxOriginal.drawImage(currentImage, 0, 0, originalCanvas.width, originalCanvas.height);
        console.log(`Immagine disegnata su canvas originale: ${originalCanvas.width}x${originalCanvas.height}`);

        // Disegna i punti selezionati
        ctxOriginal.fillStyle = 'red';
        ctxOriginal.strokeStyle = 'yellow';
        ctxOriginal.lineWidth = 2;
        selectedPoints.forEach(point => {
            ctxOriginal.beginPath();
            ctxOriginal.arc(point.x, point.y, POINT_RADIUS, 0, Math.PI * 2);
            ctxOriginal.fill();
            ctxOriginal.stroke();
        });
        console.log(`Punti selezionati: ${selectedPoints.length}`);

        // Aggiorna il contatore dei punti
        pointsCountSpan.textContent = selectedPoints.length;

        // Abilita/Disabilita pulsante Raddrizza: ora dipende solo dai 4 punti
        straightenBtn.disabled = selectedPoints.length !== 4;
    };

    // Funzione principale per raddrizzare l'immagine
    const straightenImage = () => {
        if (selectedPoints.length !== 4 || !currentImage) {
            alert('Seleziona esattamente 4 punti sull\'immagine prima di raddrizzare.');
            console.warn('Tentativo di raddrizzamento con meno di 4 punti o senza immagine.');
            return;
        }

        console.log("Stato di currentImage prima della trasformazione:", currentImage);
        if (currentImage && currentImage.naturalWidth) {
            console.log(`Dimensioni originali dell'immagine: ${currentImage.naturalWidth}x${currentImage.naturalHeight}`);
        } else {
            console.warn("currentImage non è valido o non ha dimensioni.");
        }

        const sortedPointsForDimensions = [...selectedPoints].sort((a, b) => {
            if (a.y !== b.y) return a.y - b.y;
            return a.x - b.x;
        });

        const widthTop = Math.hypot(sortedPointsForDimensions[1].x - sortedPointsForDimensions[0].x, sortedPointsForDimensions[1].y - sortedPointsForDimensions[0].y);
        const widthBottom = Math.hypot(sortedPointsForDimensions[3].x - sortedPointsForDimensions[2].x, sortedPointsForDimensions[3].y - sortedPointsForDimensions[2].y);
        
        const pointsByX = [...selectedPoints].sort((a, b) => a.x - b.x);
        const leftPoints = [pointsByX[0], pointsByX[1]];
        const rightPoints = [pointsByX[2], pointsByX[3]];

        leftPoints.sort((a, b) => a.y - b.y);
        rightPoints.sort((a, b) => a.y - b.y);

        const heightLeft = Math.hypot(leftPoints[1].x - leftPoints[0].x, leftPoints[1].y - leftPoints[0].y);
        const heightRight = Math.hypot(rightPoints[1].x - rightPoints[0].x, rightPoints[1].y - rightPoints[0].y);


        let finalOutputWidth = Math.max(widthTop, widthBottom);
        let finalOutputHeight = Math.max(heightLeft, heightRight);

        finalOutputWidth = Math.max(finalOutputWidth, 100); 
        finalOutputHeight = Math.max(finalOutputHeight, 100);

        const srcPoints = selectedPoints; 
        const dstPoints = [
            { x: 0, y: 0 },
            { x: finalOutputWidth, y: 0 },
            { x: finalOutputWidth, y: finalOutputHeight },
            { x: 0, y: finalOutputHeight }
        ];

        console.log("Punti Sorgente (srcPoints):", srcPoints);
        console.log("Punti Destinazione (dstPoints):", dstPoints);
        console.log(`Dimensioni di Output Calcolate (finalOutputWidth x finalOutputHeight): ${finalOutputWidth}x${finalOutputHeight}`);
        console.log(`straightenedCanvas.width prima del set: ${straightenedCanvas.width}, straightenedCanvas.height prima del set: ${straightenedCanvas.height}`);


        try {
            // Prepara il canvas di output
            straightenedCanvas.width = finalOutputWidth;
            straightenedCanvas.height = finalOutputHeight;
            ctxStraightened.clearRect(0, 0, finalOutputWidth, finalOutputHeight);
            console.log(`straightenedCanvas.width dopo il set: ${straightenedCanvas.width}, straightenedCanvas.height dopo il set: ${straightenedCanvas.height}`);
            
            // Chiamata alla funzione di trasformazione importata
            fourPointTransform(currentImage, straightenedCanvas, srcPoints, dstPoints);
            console.log("Chiamata a fourPointTransform() completata.");

            outputSection.style.display = 'block';
            message.textContent = 'Foto raddrizzata con successo!';
            console.log("Sezione di output mostrata.");

        } catch (e) {
            message.textContent = `Errore nel raddrizzamento: ${e.message}. Prova a selezionare i punti con maggiore precisione e assicurati che non siano allineati.`;
            outputSection.style.display = 'none';
            console.error('Errore durante la trasformazione prospettica con four-point-transform:', e);
        }
    };

    // --- Gestori degli eventi ---

    inputImage.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    currentImage = img;
                    selectedPoints = []; 
                    message.textContent = 'Foto caricata. Clicca su 4 punti per definire il rettangolo. Ordine consigliato: alto-sinistra, alto-destra, basso-destra, basso-sinistra.';
                    controls.style.display = 'block'; 
                    outputSection.style.display = 'none'; 
                    drawImageAndPoints(); 
                };
                img.onerror = () => { 
                    console.error("Errore durante il caricamento dell'immagine. Il file potrebbe essere corrotto o non un'immagine valida.");
                    message.textContent = "Errore: impossibile caricare l'immagine. Prova un altro file.";
                    currentImage = null;
                    controls.style.display = 'none';
                    outputSection.style.display = 'none';
                };
                img.src = e.target.result;
                console.log("Tentativo di caricare l'immagine da FileReader result.");
            };
            reader.onerror = (e) => { 
                console.error("Errore durante la lettura del file:", e);
                message.textContent = "Errore: impossibile leggere il file selezionato.";
            };
            reader.readAsDataURL(file);
            console.log("FileReader avviato per il file:", file.name);
        } else {
            console.log("Nessun file selezionato.");
            message.textContent = "Scegli una foto da caricare.";
        }
    });

    originalCanvas.addEventListener('click', (event) => {
        if (!currentImage || selectedPoints.length >= 4) {
            console.log(`Click ignorato: immagine non caricata o 4 punti già selezionati (${selectedPoints.length}/4).`);
            return;
        }

        const rect = originalCanvas.getBoundingClientRect();
        const scaleX = originalCanvas.width / rect.width;
        const scaleY = originalCanvas.height / rect.height;
        
        const x = (event.clientX - rect.left) * scaleX;
        const y = (event.clientY - rect.top) * scaleY;
        
        selectedPoints.push({ x: x, y: y });
        console.log(`Punto selezionato: (${x.toFixed(2)}, ${y.toFixed(2)}). Totale: ${selectedPoints.length}`);
        drawImageAndPoints(); 
    });

    resetPointsBtn.addEventListener('click', () => {
        selectedPoints = [];
        message.textContent = 'Punti resettati. Clicca su 4 nuovi punti per definire il rettangolo.';
        outputSection.style.display = 'none';
        drawImageAndPoints();
        console.log("Punti resettati.");
    });

    straightenBtn.addEventListener('click', straightenImage);

    downloadBtn.addEventListener('click', () => {
        const link = document.createElement('a');
        link.download = 'foto_raddrizzata.png';
        link.href = straightenedCanvas.toDataURL('image/png');
        link.click();
        console.log("Inizio download foto raddrizzata.");
    });

    message.textContent = "Carica una foto per iniziare.";
    drawImageAndPoints(); 
});