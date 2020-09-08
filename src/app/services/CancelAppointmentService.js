import { isBefore, subHours } from 'date-fns';
import CancellationMail from '../jobs/CancellationMail';
import Queue from '../../lib/Queue';
import Appointment from '../models/Appointment';
import User from '../models/User';
import Cache from '../../lib/Cache';

class CancelAppointmentService {
  async run({ provider_id, user_id }) {
    const appointment = await Appointment.findByPk(provider_id, {
      include: [
        {
          model: User,
          as: 'provider',
          attributes: ['name', 'email'],
        },
        {
          model: User,
          as: 'user',
          attributes: ['name'],
        },
      ],
    });

    if (appointment.user_id !== user_id) {
      throw new Error("You don't have permission to cancel this appointment.");
    }

    // removo duas horas da data agendada
    const dateWithSub = subHours(appointment.date, 2);
    const NOW = new Date();
    if (isBefore(dateWithSub, NOW)) {
      throw new Error('You can only cancel appointment 2 hours in advance.');
    }

    appointment.canceled_at = NOW;

    await appointment.save();

    await Queue.add(CancellationMail.key, { appointment });

    await Cache.invalidatePrefix(`user:${user_id}:appointments`);

    return appointment;
  }
}

export default new CancelAppointmentService();
