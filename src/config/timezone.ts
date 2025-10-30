/**
 * Timezone configuration and Date override for IST
 * This file should be imported before any other modules that use Date
 */

// Set timezone environment variable
process.env.TZ = 'Asia/Kolkata';

// Store original Date constructor
const OriginalDate = Date;

// Override global Date to use IST
(global as any).Date = class extends OriginalDate {
  constructor(...args: any[]) {
    if (args.length === 0) {
      // For new Date() - get current time in IST
      const now = new OriginalDate();
      const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
      super(now.getTime() + istOffset);
    } else if (args.length === 1) {
      super(args[0]);
    } else {
      super(args[0], args[1], args[2], args[3], args[4], args[5], args[6]);
    }
  }
  
  static now() {
    const utcNow = OriginalDate.now();
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
    return utcNow + istOffset;
  }
};

export {}; // Make this a module
