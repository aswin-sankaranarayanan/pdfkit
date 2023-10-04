const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const { PDFDocument, rgb, degrees } = require('pdf-lib');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.get('/', (req, res) => {
    res.render('index');
});

app.post('/upload', upload.single('pdfFile'), async (req, res) => {
    try {
        const pdfBuffer = req.file.buffer;

        // Create a PDF document from the uploaded PDF
        const pdfDoc = await PDFDocument.load(pdfBuffer);
        const pages = pdfDoc.getPages();
        const firstPage = pages[2];

        // Add a signature text field
        /*
        const signatureField = firstPage.drawText('Your Signature', {
            x: 100,
            y: 150,
            size: 20,
            color: rgb(0, 0, 0),
            rotate: degrees(0),
        });
        */
        // Get the signature image data from the canvas
        const signatureImageData = req.body.signatureImage;

        // Embed the signature image into the PDF
        if (signatureImageData) {
            const signatureImage = await pdfDoc.embedPng(signatureImageData);
            const signatureImageWidth = 100; // Adjust the width as needed

            // Add the signature image to the PDF
            await firstPage.drawImage(signatureImage, {
                x: 100,
                y: 50,
                width: signatureImageWidth,
            });
        }

        // Serialize the modified PDF document
        const modifiedPdfBytes = await pdfDoc.save();

        // Send the modified PDF as a download
        res.setHeader('Content-Disposition', 'attachment; filename=signed.pdf');
        res.setHeader('Content-Type', 'application/pdf');
        res.end(modifiedPdfBytes);

    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
