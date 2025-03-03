import { test, expect } from '@playwright/test';
import { format, addDays } from 'date-fns';
import type { Page } from '@playwright/test';

async function createTestPost(page: Page, title: string) {
  await page.click('text=New Post');
  await page.fill('input[name="title"]', title);
  const frame = page.frameLocator('.tox-edit-area__iframe');
  await frame.locator('body').fill('Test content for ' + title);
  await page.click('text=Save Post');
}

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
    await expect(page.locator(`text=${format(tomorrow, 'PPP')}`)).toBeVisible();
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

  test('should support post editing workflow', async ({ page }) => {
    // Create initial post
    await createTestPost(page, 'Edit Workflow Test');
    
    // Find and edit the post
    await page.click('text=Edit Workflow Test');
    await page.fill('input[name="title"]', 'Updated Title');
    await page.click('text=Save Post');

    // Verify changes
    await expect(page.locator('text=Updated Title')).toBeVisible();
    await expect(page.locator('text=Edit Workflow Test')).not.toBeVisible();
  });

  test('should handle draft to published transitions', async ({ page }) => {
    await createTestPost(page, 'Draft Post');
    
    // Find the draft post and publish it
    await page.click('text=Draft Post');
    await page.click('text=Publish');
    await page.click('text=Confirm Publish');

    // Verify status change
    await expect(page.locator('text=Published')).toBeVisible();
    
    // Verify it appears in published posts list
    await page.click('text=Published Posts');
    await expect(page.locator('text=Draft Post')).toBeVisible();
  });

  test('should support post categorization and tagging', async ({ page }) => {
    await page.click('text=New Post');
    await page.fill('input[name="title"]', 'Categorized Post');
    
    // Add category
    await page.click('text=Select Category');
    await page.click('text=Technology');
    
    // Add tags
    await page.fill('input[name="tags"]', 'test-tag');
    await page.keyboard.press('Enter');
    await page.fill('input[name="tags"]', 'another-tag');
    await page.keyboard.press('Enter');
    
    await page.click('text=Save Post');

    // Verify post appears in category view
    await page.click('text=Categories');
    await page.click('text=Technology');
    await expect(page.locator('text=Categorized Post')).toBeVisible();
  });

  test('should support bulk operations', async ({ page }) => {
    // Create multiple test posts
    await createTestPost(page, 'Bulk Post 1');
    await createTestPost(page, 'Bulk Post 2');
    await createTestPost(page, 'Bulk Post 3');

    // Select multiple posts
    await page.click('checkbox[aria-label="Select Bulk Post 1"]');
    await page.click('checkbox[aria-label="Select Bulk Post 2"]');
    
    // Perform bulk publish
    await page.click('text=Bulk Actions');
    await page.click('text=Publish Selected');
    await page.click('text=Confirm');

    // Verify status changes
    await expect(page.locator('text=2 posts published')).toBeVisible();
  });

  test('should support post search functionality', async ({ page }) => {
    // Create posts with distinct content
    await createTestPost(page, 'Unique Title One');
    await createTestPost(page, 'Unique Title Two');

    // Test search
    await page.fill('input[placeholder="Search posts..."]', 'Unique Title One');
    await page.keyboard.press('Enter');

    // Verify search results
    await expect(page.locator('text=Unique Title One')).toBeVisible();
    await expect(page.locator('text=Unique Title Two')).not.toBeVisible();

    // Test advanced search filters
    await page.click('text=Advanced Search');
    await page.selectOption('select[name="status"]', 'draft');
    await page.fill('input[name="dateFrom"]', format(new Date(), 'yyyy-MM-dd'));
    await page.click('text=Search');

    // Verify filtered results
    await expect(page.locator('.search-results')).toContainText('Showing draft posts from');
  });

  test('should handle SEO metadata', async ({ page }) => {
    await page.click('text=New Post');
    await page.fill('input[name="title"]', 'SEO Test Post');

    // Open SEO section
    await page.click('text=SEO Settings');

    // Fill SEO metadata
    await page.fill('input[name="meta-title"]', 'Custom Meta Title');
    await page.fill('textarea[name="meta-description"]', 'Custom meta description for search results');
    await page.fill('input[name="meta-keywords"]', 'test, seo, keywords');

    await page.click('text=Save Post');

    // View post and verify meta tags
    await page.click('text=View Post');
    await expect(page).toHaveTitle('Custom Meta Title');
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', 'Custom meta description for search results');
    await expect(page.locator('meta[name="keywords"]')).toHaveAttribute('content', 'test, seo, keywords');
  });

  test('should handle post preview functionality', async ({ page }) => {
    await page.click('text=New Post');
    await page.fill('input[name="title"]', 'Preview Test Post');
    
    const frame = page.frameLocator('.tox-edit-area__iframe');
    await frame.locator('body').fill('This is a test of the preview functionality');

    // Open preview
    await page.click('text=Preview');

    // Switch to preview tab/window
    const previewPage = await page.waitForEvent('popup');
    await expect(previewPage.locator('h1')).toHaveText('Preview Test Post');
    await expect(previewPage.locator('article')).toContainText('This is a test of the preview functionality');

    // Verify preview shows unpublished changes
    await page.bringToFront();
    await page.fill('input[name="title"]', 'Updated Preview Title');
    await previewPage.reload();
    await expect(previewPage.locator('h1')).toHaveText('Updated Preview Title');
  });
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
