const axios = require("axios");
const FormData = require("form-data");
import { StudentResultDto } from "@/types";
const { encodePayload } = require("../utils/encodeDecode");

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

export class WhatsAppService {

  static async sendWhatsAppResult(
    toNumber: string,
    studentId: number,
    examId: number,
    result: StudentResultDto
  ): Promise<void> {
    try {
      // Encode hidden payload
      const payload = encodePayload({ studentId, examId });

      const response = await axios.post(
        `https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`,
        {
          messaging_product: "whatsapp",
          to: `91${toNumber}`,
          type: "interactive",
          interactive: {
            type: "button",
            body: {
              text: result,
            },
            action: {
              buttons: [
                {
                  type: "reply",
                  reply: {
                    id: payload,
                    title: "Get My Result",
                  },
                },
              ],
            },
          },
        },
        {
          headers: {
            Authorization: `Bearer ${WHATSAPP_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log("WhatsApp message sent:", response.data);
    } catch (err: any) {
      console.error('Error sending WhatsApp message:', err);
      throw new Error('Failed to send WhatsApp message');
    }
  }

  static async sendPdf(toNumber: number, buffer: Buffer, filename = "result.pdf") {
    try {
        // 1. Upload PDF buffer
        const mediaId = await this.uploadMedia(buffer, filename, "application/pdf");

        // 2. Send the PDF using media_id
        const response = await axios.post(
            `https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`,
            {
                messaging_product: "whatsapp",
                to: toNumber,
                type: "document",
                document: {
                    id: mediaId,
                    filename,
                    caption: "Here is your exam PDF"
                }
            },
            {
                headers: {
                    Authorization: `Bearer ${WHATSAPP_TOKEN}`,
                    "Content-Type": "application/json"
                }
            }
        );

        console.log("PDF sent:", response.data);
    } catch (err: any) {
        console.error("Error sending PDF:", err.response?.data || err.message);
    }
}

  private static async uploadMedia(buffer: Buffer, filename: string, mimeType: string): Promise<string> {
    try {
        const formData = new FormData();
        formData.append('file', buffer, { filename, contentType: mimeType });
        formData.append('messaging_product', 'whatsapp');

        const response = await axios.post(
            `https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/media`,
            formData,
            {
                headers: {
                    Authorization: `Bearer ${WHATSAPP_TOKEN}`,
                    ...formData.getHeaders()
                }
            }
        );

        return response.data.id; // media_id
    } catch (err: any) {
        console.error("Error uploading media:", err.response?.data || err.message);
        throw err;
    }
}
}
