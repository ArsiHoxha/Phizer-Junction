import { HEALTH_DATASET, HealthDataPoint } from '../data/healthDataset';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/**
 * Export health dataset to CSV format
 * Creates a spreadsheet with all 100 data points for review
 */
export async function exportHealthDatasetToCSV(): Promise<void> {
  try {
    // Create CSV header
    const headers = [
      'ID',
      'Timestamp',
      'Date',
      'Time',
      'HRV (ms)',
      'Heart Rate (bpm)',
      'Stress (%)',
      'Sleep Quality (%)',
      'Sleep Hours',
      'Steps',
      'Screen Time (min)',
      'Notifications',
      'Activity Level',
      'Temperature (°C)',
      'Humidity (%)',
      'Pressure (hPa)',
      'UV Index',
      'Calendar Events',
      'Calendar Stress (%)',
      'Migraine Risk (%)',
      'Has Migraine',
    ].join(',');

    // Convert data points to CSV rows
    const rows = HEALTH_DATASET.map((point: HealthDataPoint) => {
      const date = new Date(point.timestamp);
      return [
        point.id,
        point.timestamp.toISOString(),
        date.toLocaleDateString('en-US'),
        date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        point.hrv,
        point.heartRate,
        point.stress,
        point.sleepQuality,
        point.sleepHours.toFixed(1),
        point.steps,
        point.screenTimeMinutes,
        point.notificationCount,
        point.activityLevel,
        point.temperature.toFixed(1),
        point.humidity,
        point.pressure,
        point.uvIndex.toFixed(1),
        point.calendarEvents,
        point.calendarStress,
        point.migraineRisk,
        point.hasMigraine ? 'YES' : 'NO',
      ].join(',');
    });

    // Combine header and rows
    const csvContent = [headers, ...rows].join('\n');

    // Create file path
    const fileName = `health_dataset_${new Date().toISOString().split('T')[0]}.csv`;
    const filePath = `${FileSystem.documentDirectory}${fileName}`;

    // Write to file
    await FileSystem.writeAsStringAsync(filePath, csvContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    // Share the file
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(filePath, {
        mimeType: 'text/csv',
        dialogTitle: 'Export Health Dataset',
        UTI: 'public.comma-separated-values-text',
      });
    }

    console.log('✅ Dataset exported successfully:', fileName);
  } catch (error) {
    console.error('❌ Error exporting dataset:', error);
    throw error;
  }
}

/**
 * Get dataset statistics for display
 */
export function getDatasetStatistics() {
  const migraines = HEALTH_DATASET.filter(d => d.hasMigraine);
  const totalEntries = HEALTH_DATASET.length;
  
  const avgHRV = Math.round(
    HEALTH_DATASET.reduce((sum, d) => sum + d.hrv, 0) / totalEntries
  );
  
  const avgStress = Math.round(
    HEALTH_DATASET.reduce((sum, d) => sum + d.stress, 0) / totalEntries
  );
  
  const avgRisk = Math.round(
    HEALTH_DATASET.reduce((sum, d) => sum + d.migraineRisk, 0) / totalEntries
  );
  
  const avgSleep = (
    HEALTH_DATASET.reduce((sum, d) => sum + d.sleepHours, 0) / totalEntries
  ).toFixed(1);
  
  const dateRange = {
    start: HEALTH_DATASET[0].timestamp,
    end: HEALTH_DATASET[totalEntries - 1].timestamp,
  };

  return {
    totalEntries,
    migraineCount: migraines.length,
    migrainePercentage: Math.round((migraines.length / totalEntries) * 100),
    avgHRV,
    avgStress,
    avgRisk,
    avgSleep,
    dateRange,
  };
}

/**
 * Generate a summary report of the dataset
 */
export function generateDatasetSummary(): string {
  const stats = getDatasetStatistics();
  
  return `
📊 Health Dataset Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📅 Date Range:
   ${stats.dateRange.start.toLocaleDateString()} - ${stats.dateRange.end.toLocaleDateString()}

📈 Total Entries: ${stats.totalEntries}
   (${Math.floor(stats.totalEntries / 3)} days of data, 3 readings/day)

🔴 Migraine Events: ${stats.migraineCount} (${stats.migrainePercentage}%)

📊 Average Metrics:
   • HRV: ${stats.avgHRV}ms
   • Stress Level: ${stats.avgStress}%
   • Migraine Risk: ${stats.avgRisk}%
   • Sleep: ${stats.avgSleep} hours

💡 Dataset includes realistic patterns:
   ✓ Stress buildup cycles
   ✓ Weather-triggered events
   ✓ Poor sleep correlations
   ✓ Screen time overload
   ✓ Weekend recovery periods
   ✓ Work pressure spikes

🎯 Perfect for AI learning and pattern recognition!
  `;
}
