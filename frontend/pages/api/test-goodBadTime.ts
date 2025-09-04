import { getRahuKalam, abhijitMuhurth, brahmaMuhurtham, pradoshaTime } from '@/lib/goodBadTime';
import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Test getRahuKalam
    const rahuKalamResult = getRahuKalam('06:00 AM', '06:00 PM', 'Monday');
    
    // Test abhijitMuhurth
    const abhijitResult = abhijitMuhurth('06:00 AM', '06:00 PM');
    
    // Test brahmaMuhurtham
    const brahmaResult = brahmaMuhurtham('06:00 AM');
    
    // Test pradoshaTime
    const pradoshaResult = pradoshaTime('06:00 PM', '06:00 AM');
    
    res.status(200).json({
      rahuKalam: rahuKalamResult,
      abhijitMuhurth: abhijitResult,
      brahmaMuhurtham: brahmaResult,
      pradoshaTime: pradoshaResult,
    });
  } catch (error) {
    console.error('Error testing goodBadTime functions:', error);
    res.status(500).json({ error: 'Failed to test goodBadTime functions', details: error.message });
  }
}