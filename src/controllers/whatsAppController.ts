import { WhatsAppService } from '../services/whatsappService';
import { ServiceFactory } from '../utils/serviceFactory';
import { Request, Response } from 'express';
import { decodePayload } from '../utils/encodeDecode';

export const verifyWebhook = (req: Request, res: Response) => {
    const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
   const { 'hub.mode': mode, 'hub.challenge': challenge, 'hub.verify_token': token } = req.query;

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('WEBHOOK VERIFIED');
    res.status(200).send(challenge);
  } else {
    res.status(403).end();
  }
}

export const receiveMessage = async (req: Request, res: Response) => {
    try {
        const entry = req.body.entry || [];
        for (let e of entry) {
            const changes = e.changes || [];
            for (let c of changes) {
                const messages = c.value?.messages || [];
                for (let msg of messages) {
                    const from = msg.from;

                    if (msg.button?.payload) {
                        const payload = decodePayload(msg.button.payload);
                        const examId = payload.examId;
                        const studentId = payload.studentId;

                        const examService = ServiceFactory.getExamService();
                        const pdfBuffer = await examService.getResultPdfService(studentId, examId);

                        const filename = `Result-${examId}.pdf`;

                        // Send PDF
                        await WhatsAppService.sendPdf(from, pdfBuffer, filename);
                    }
                }
            }
        }

        res.sendStatus(200);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
}

