import { test, expect } from '@playwright/test';
import { format } from 'date-fns';

test.describe('Post Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/posts');
  });

  test('should create a new draft post', async ({ page }) => {
    await page.click('text=New Post');
    await page.fill('input[name="title"]', 'Test Draft Post');
    
    // Type in TinyMCE editor
    const frame = page.frameLocator('.tox-edit-area__iframe');
    await frame.locator('body').fill('This is a test post content');
    
    // Ensure draft is selected
    await page.check('input[value="draft"]');
    
    await page.click('text=Save Post');
    
    // Verify we're redirected to posts list
    await expect(page).toHaveURL('/admin/posts');
    
    // Verify the new post appears in the list
    await expect(page.locator('text=Test Draft Post')).toBeVisible();
  });

  test('should schedule a post for future publication', async ({ page }) => {
    await page.click('text=New Post');
    await page.fill('input[name="title"]', 'Scheduled Post');
    
    // Type in TinyMCE editor
    const frame = page.frameLocator('.tox-edit-area__iframe');
    await frame.locator('body').fill('This is a scheduled post');
    
    // Set to scheduled
    await page.check('input[value="scheduled"]');
    
    // Set future date/time
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    await page.fill('input[type="date"]', format(tomorrow, 'yyyy-MM-dd'));
    await page.fill('input[type="time"]', '12:00');
    
    await page.click('text=Save Post');
    
    // Verify post appears in scheduled posts section
    await expect(page.locator('text=Scheduled Post')).toBeVisible();
    await expect(page.locator(\`text=\${format(tomorrow, 'PPP')}\`)).toBeVisible();
  });

  test('should handle image uploads in post content', async ({ page }) => {
    await page.click('text=New Post');
    await page.fill('input[name="title"]', 'Post with Image');
    
    // Open media library
    await page.click('button:has-text("Open Media Library")');
    
    // Upload an image
    await page.setInputFiles('input[type="file"]', './e2e/fixtures/test-image.jpg');
    
    // Wait for upload to complete and select image
    await page.click('img[alt="test-image"]');
    await page.click('text=Insert Selected');
    
    // Verify image is in editor
    const frame = page.frameLocator('.tox-edit-area__iframe');
    await expect(frame.locator('img')).toBeVisible();
    
    await page.click('text=Save Post');
    
    // Verify post was created with image
    await expect(page).toHaveURL('/admin/posts');
    await expect(page.locator('text=Post with Image')).toBeVisible();
  });

  test('should validate scheduling rules', async ({ page }) => {
    await page.click('text=New Post');
    await page.fill('input[name="title"]', 'Invalid Schedule Test');
    
    // Set to scheduled
    await page.check('input[value="scheduled"]');
    
    // Set past date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    await page.fill('input[type="date"]', format(yesterday, 'yyyy-MM-dd'));
    await page.fill('input[type="time"]', '12:00');
    
    // Try to save
    await page.click('text=Save Post');
    
    // Verify error message
    await expect(page.locator('text=Please select a future date and time')).toBeVisible();
    
    // Verify we're still on the editor page
    await expect(page).toHaveURL('/admin/editor');
  });
});
