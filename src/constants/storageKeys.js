/**
 * منبع حقیقت واحد برای کلیدهای localStorage در سرویس‌های سروستان
 */

export const LIVE_DATA_KEYS = [
  'sarvestan_live_profile',
  'sarvestan_live_schedule',
  'sarvestan_live_exams',
  'sarvestan_live_transcripts',
  'sarvestan_live_courses',
  'sarvestan_live_finance',
  'sarvestan_live_workflows',
  'sarvestan_live_curriculum_stats',
  'sarvestan_live_curriculum_report',
  'sarvestan_live_announcements',
  'sarvestan_live_reg77',
  'sarvestan_live_sync_meta',
];

export const CUSTOM_SCHEDULE_KEYS = [
  'sarvestan_raw_behestan_schedule',
  'sarvestan_raw_behestan_exams',
  'sarvestan_schedule_customized',
  'sarvestan_schedule_deleted_courses',
  'sarvestan_schedule_deleted_exams',
  'sarvestan_behestan_deleted_courses',
  'sarvestan_local_notes',
  'sarvestan_manual_equivalences',
];

export const USER_PREF_KEYS = [
  'sarvestan_app_icon',
  'sarvestan_selected_university',
  'sarvestan_auth_status',
  'sarvestan_theme',
  'sarvestan_bat_mode',
  'sarvestan_bat_notif_enabled',
  'sarvestan_animation_level',
  'sarvestan_dashboard_widgets_v1',
  'sarvestan_feed_read_ids',
  'sarvestan_feed_subscribed_channels',
  'sarvestan_feed_unsub_announcements',
  'sarv_schedule_subview',
  'sarv_matrix_transposed',
  'sarv_task_view_mode_v1',
  'sarv_study_sound_v1',
  'sarv_study_wakelock_v1',
  'sarv_study_tasks_v1',
  'sarv_study_sessions_v1',
  'sarv_study_settings_v1',
  'sarvestan_class_reminders_settings',
  'sarvestan_samad_reminder_settings',
  'sarvestan_moodle_synced_tasks',
  'sarvestan_finance_currency',
  'sarvestan_privacy_mode',
  'sarvestan_user_birthday',
];

/**
 * کلیدهای قابل انتقال در بکاپ JSON و QR
 * (کلیدهای موقت/کش مانند sarvestan_feed_cache، sarvestan_bat_scheduled_ids و sarv_active_study_timer_v2 عمداً مستثنی شده‌اند)
 */
export const BACKUP_STORAGE_KEYS = [
  ...LIVE_DATA_KEYS,
  ...CUSTOM_SCHEDULE_KEYS,
  ...USER_PREF_KEYS,
];
