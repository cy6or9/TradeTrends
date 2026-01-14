#!/usr/bin/env node

/**
 * Generate individual HTML pages for each activity
 */

const fs = require('fs');
const path = require('path');

const ACTIVITIES_JSON = path.join(__dirname, '../public/data/activities.json');
const TEMPLATE_FILE = path.join(__dirname, '../public/activity/activity-template.html');
const OUTPUT_DIR = path.join(__dirname, '../public/activity');

// Read activities data
const activitiesData = JSON.parse(fs.readFileSync(ACTIVITIES_JSON, 'utf-8'));
const template = fs.readFileSync(TEMPLATE_FILE, 'utf-8');

console.log(`Found ${activitiesData.items.length} activities`);

// Generate a page for each activity
activitiesData.items.forEach((activity) => {
  const filename = `${activity.id}.html`;
  const filepath = path.join(OUTPUT_DIR, filename);
  
  // Create a copy of the template for this activity
  let activityPage = template;
  
  // The template uses URL parameters, so we just copy it as-is
  // The JavaScript in the template will load the activity data dynamically
  
  fs.writeFileSync(filepath, activityPage);
  console.log(`✅ Generated: ${filename}`);
});

console.log(`\n✨ Generated ${activitiesData.items.length} activity pages`);
console.log(`📁 Location: ${OUTPUT_DIR}`);
