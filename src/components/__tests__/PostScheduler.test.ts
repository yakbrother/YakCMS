import { describe, it, expect, beforeEach } from 'vitest';
import { screen, render, fireEvent, within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { PostScheduler } from '../PostScheduler.astro';
import { format, addDays, subMinutes } from 'date-fns';
import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';

describe('PostScheduler', () => {
  const user = userEvent.setup();
  
  describe('Timezone Handling', () => {
    it('should convert input times to UTC', async () => {
      render(await PostScheduler({ timezone: 'America/New_York' }));
      
      const scheduledRadio = screen.getByLabelText('Schedule');
      await user.click(scheduledRadio);

      // Set local time 9 PM EST
      const dateInput = screen.getByLabelText('Date');
      const timeInput = screen.getByLabelText('Time');
      
      await user.type(dateInput, '2025-03-02');
      await user.type(timeInput, '21:00');

      const hiddenUtcInput = document.querySelector('input[name="publishDateUtc"]');
      expect(hiddenUtcInput).toHaveValue('2025-03-03T02:00:00.000Z'); // 9 PM EST = 2 AM UTC next day
    });

    it('should handle daylight savings transitions', async () => {
      render(await PostScheduler({ timezone: 'America/New_York' }));
      
      const scheduledRadio = screen.getByLabelText('Schedule');
      await user.click(scheduledRadio);

      // Set date during DST transition
      await user.type(screen.getByLabelText('Date'), '2025-03-10'); // DST starts
      await user.type(screen.getByLabelText('Time'), '02:30');

      const warning = screen.getByText(/during daylight savings transition/i);
      expect(warning).toBeVisible();
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard navigable', async () => {
      render(await PostScheduler({ timezone: 'UTC' }));
      
      const scheduledRadio = screen.getByLabelText('Schedule');
      await user.tab();
      expect(scheduledRadio).toHaveFocus();

      await user.keyboard('{Space}'); // Select scheduled
      await user.tab();
      expect(screen.getByLabelText('Date')).toHaveFocus();
    });

    it('should announce validation errors to screen readers', async () => {
      render(await PostScheduler({ timezone: 'UTC' }));
      
      const scheduledRadio = screen.getByLabelText('Schedule');
      await user.click(scheduledRadio);

      // Set past date
      const dateInput = screen.getByLabelText('Date');
      await user.type(dateInput, format(subMinutes(new Date(), 5), 'yyyy-MM-dd'));

      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toHaveAttribute('aria-live', 'polite');
    });

    it('should have proper ARIA labels', async () => {
      render(await PostScheduler({ timezone: 'UTC' }));
      
      const radioGroup = screen.getByRole('radiogroup');
      expect(radioGroup).toHaveAttribute('aria-label', 'Publication Status');

      const dateInput = screen.getByLabelText('Date');
      expect(dateInput).toHaveAttribute('aria-describedby', expect.stringMatching(/date-help/));
    });
  });

  describe('Edge Cases', () => {
    it('should handle midnight boundary correctly', async () => {
      render(await PostScheduler({ timezone: 'UTC' }));
      
      const scheduledRadio = screen.getByLabelText('Schedule');
      await user.click(scheduledRadio);

      await user.type(screen.getByLabelText('Date'), '2025-03-02');
      await user.type(screen.getByLabelText('Time'), '23:59');

      const preview = screen.getByText(/Will be published/);
      expect(preview).toHaveTextContent('2025-03-02 23:59 UTC');
    });

    it('should handle form reset', async () => {
      render(await PostScheduler({ timezone: 'UTC' }));
      
      const scheduledRadio = screen.getByLabelText('Schedule');
      await user.click(scheduledRadio);

      await user.type(screen.getByLabelText('Date'), '2025-03-02');
      await user.type(screen.getByLabelText('Time'), '12:00');

      await user.click(screen.getByRole('button', { name: /reset/i }));

      expect(screen.getByLabelText('Draft')).toBeChecked();
      expect(screen.getByLabelText('Date')).toHaveValue('');
      expect(screen.getByLabelText('Time')).toHaveValue('');
    });
  });

  beforeEach(() => {
    // Reset the document body
    document.body.innerHTML = '';
  });

  it('should render with default draft status', async () => {
    render(await PostScheduler({ timezone: 'UTC' }));
    
    const draftRadio = screen.getByLabelText('Draft');
    expect(draftRadio).toBeChecked();
  });

  it('should show schedule inputs when scheduled is selected', async () => {
    render(await PostScheduler({ timezone: 'UTC' }));
    
    const scheduledRadio = screen.getByLabelText('Schedule');
    fireEvent.click(scheduledRadio);

    expect(screen.getByLabelText('Date')).toBeVisible();
    expect(screen.getByLabelText('Time')).toBeVisible();
  });

  it('should validate future dates', async () => {
    render(await PostScheduler({ timezone: 'UTC' }));
    
    const scheduledRadio = screen.getByLabelText('Schedule');
    fireEvent.click(scheduledRadio);

    const dateInput = screen.getByLabelText('Date');
    const timeInput = screen.getByLabelText('Time');

    // Set past date
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    fireEvent.change(dateInput, { target: { value: pastDate.toISOString().split('T')[0] } });
    fireEvent.change(timeInput, { target: { value: '12:00' } });

    expect(screen.getByText('Please select a future date and time')).toBeVisible();
  });

  it('should format datetime correctly', async () => {
    render(await PostScheduler({ timezone: 'UTC' }));
    
    const scheduledRadio = screen.getByLabelText('Schedule');
    fireEvent.click(scheduledRadio);

    const dateInput = screen.getByLabelText('Date');
    const timeInput = screen.getByLabelText('Time');

    // Set future date
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    fireEvent.change(dateInput, { target: { value: futureDate.toISOString().split('T')[0] } });
    fireEvent.change(timeInput, { target: { value: '12:00' } });

    expect(screen.getByText(/Will be published:/)).toBeVisible();
  });

  it('should update hidden inputs when values change', async () => {
    render(await PostScheduler({ timezone: 'UTC' }));
    
    const scheduledRadio = screen.getByLabelText('Schedule');
    fireEvent.click(scheduledRadio);

    const dateInput = screen.getByLabelText('Date');
    const timeInput = screen.getByLabelText('Time');

    const testDate = '2025-03-02';
    const testTime = '15:00';

    fireEvent.change(dateInput, { target: { value: testDate } });
    fireEvent.change(timeInput, { target: { value: testTime } });

    const hiddenDateInput = document.querySelector('input[name="publishDate"]') as HTMLInputElement;
    const hiddenTimeInput = document.querySelector('input[name="publishTime"]') as HTMLInputElement;
    const hiddenStatusInput = document.querySelector('input[name="publishStatus"]') as HTMLInputElement;

    expect(hiddenDateInput.value).toBe(testDate);
    expect(hiddenTimeInput.value).toBe(testTime);
    expect(hiddenStatusInput.value).toBe('scheduled');
  });
});
