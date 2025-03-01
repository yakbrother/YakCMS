import { describe, it, expect, beforeEach } from 'vitest';
import { screen, render, fireEvent } from '@testing-library/dom';
import { PostScheduler } from '../PostScheduler.astro';

describe('PostScheduler', () => {
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
