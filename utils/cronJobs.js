const cron = require('node-cron');
const Complaint = require('../models/Complaint');
const Notification = require('../models/Notification');

const startCronJobs = (io) => {
  // Schedule a cron job to run every day at 8am
  cron.schedule('0 8 * * *', async () => {
    try {
      const now = new Date();
      
      // Find all overdue complaints (not resolved and deadline passed)
      const overdueComplaints = await Complaint.find({
        status: { $ne: 'resolved' },
        deadline: { $lt: now }
      });

      console.log(`Found ${overdueComplaints.length} overdue complaints`);

      // For each overdue complaint, create a notification and emit event
      for (const complaint of overdueComplaints) {
        const message = `Your complaint "${complaint.title}" is overdue`;
        
        // Create notification in database
        const notification = await Notification.create({
          userId: complaint.tenantId,
          message: message,
          type: 'deadline',
          refId: complaint._id
        });

        // Emit socket.io event to tenant's room
        io.to(complaint.tenantId.toString()).emit('notification', {
          message: notification.message
        });
      }
    } catch (error) {
      console.error('Error in overdue complaints cron job:', error);
    }
  });
};

module.exports = { startCronJobs };
