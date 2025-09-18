import { WhatsAppService } from '../services/whatsappService';
import { ServiceFactory } from '../utils/serviceFactory';
import { Request, Response } from 'express';
import { decodePayload } from '../utils/encodeDecode';

export const verifyWebhook = (req: Request, res: Response) => {
    const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('Webhook verified!');
            res.status(200).send(challenge);
        } else {
            res.sendStatus(403);
        }
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

                    if (msg.interactive?.button_reply?.id) {
                        const payload = decodePayload(msg.interactive.button_reply.id);
                        const examId = payload.examId;
                        const studentId = payload.studentId;

                        console.log(`Button clicked by ${from}, ExamID: ${examId}, StudentID: ${studentId}`);

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

