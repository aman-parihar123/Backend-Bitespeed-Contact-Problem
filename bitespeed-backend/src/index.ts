import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();

app.use(express.json());

app.post('/identify', async (req: Request, res: Response): Promise<void> => {
  const { email, phoneNumber }: { email?: string; phoneNumber?: string } = req.body;

  if (!email && !phoneNumber) {
    res.status(400).json({ error: 'Either email or phoneNumber must be provided.' });
    return;
  }

  try {
    // Find contacts with the same email or phoneNumber
    const contacts = await prisma.contact.findMany({
      where: {
        OR: [
          { email: email ?? undefined },
          { phoneNumber: phoneNumber ?? undefined }
        ]
      }
    });

    if (contacts.length === 0) {
      // No matches found, create a new primary contact
      const newContact = await prisma.contact.create({
        data: {
          email,
          phoneNumber,
          linkPrecedence: 'primary'
        }
      });

      res.status(200).json({
        contact: {
          primaryContatctId: newContact.id,
          emails: [newContact.email].filter(Boolean),
          phoneNumbers: [newContact.phoneNumber].filter(Boolean),
          secondaryContactIds: []
        }
      });
      return;
    }

    // Find the primary contact ID (the oldest contact)
    const primaryIds = contacts.map(c => c.linkedId ?? c.id);
    const primaryContactId = Math.min(...primaryIds);

    // Find all contacts linked to this primary
    const allContacts = await prisma.contact.findMany({
      where: {
        OR: [
          { id: primaryContactId },
          { linkedId: primaryContactId }
        ]
      }
    });

    // Check if a new contact with different email/phoneNumber is needed
    const hasEmail = allContacts.some(c => c.email === email);
    const hasPhone = allContacts.some(c => c.phoneNumber === phoneNumber);
    if ((!hasEmail && email) || (!hasPhone && phoneNumber)) {
      await prisma.contact.create({
        data: {
          email,
          phoneNumber,
          linkPrecedence: 'secondary',
          linkedId: primaryContactId
        }
      });
    }

    // Gather response data
    const primaryContact = allContacts.find(c => c.id === primaryContactId);
    const emails = [primaryContact?.email, ...allContacts.filter(c => c.id !== primaryContactId).map(c => c.email)].filter(Boolean) as string[];
    const phoneNumbers = [primaryContact?.phoneNumber, ...allContacts.filter(c => c.id !== primaryContactId).map(c => c.phoneNumber)].filter(Boolean) as string[];
    const secondaryIds = allContacts.filter(c => c.id !== primaryContactId).map(c => c.id);

    res.status(200).json({
      contact: {
        primaryContatctId: primaryContactId,
        emails: Array.from(new Set(emails)),
        phoneNumbers: Array.from(new Set(phoneNumbers)),
        secondaryContactIds: secondaryIds
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
