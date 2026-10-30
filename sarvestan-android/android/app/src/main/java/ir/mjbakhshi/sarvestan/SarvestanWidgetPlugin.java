package ir.mjbakhshi.sarvestan;

import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.SharedPreferences;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** به‌روزرسانی تمام ویجت‌های خانه از داده‌های سنک‌شده */
@CapacitorPlugin(name = "SarvestanWidget")
public class SarvestanWidgetPlugin extends Plugin {

    @PluginMethod
    public void update(PluginCall call) {
        Context ctx = getContext();
        if (ctx == null) {
            call.reject("no context");
            return;
        }
        String nextTitle = call.getString("nextTitle", "");
        String nextTime = call.getString("nextTime", "");
        String nextRoom = call.getString("nextRoom", "");
        String examTitle = call.getString("examTitle", "");
        int examDays = call.getInt("examDays", -1) == null ? -1 : call.getInt("examDays", -1);
        String examDate = call.getString("examDate", "");
        String secondExamTitle = call.getString("secondExamTitle", "");
        int secondExamDays = call.getInt("secondExamDays", -1) == null ? -1 : call.getInt("secondExamDays", -1);
        String gpa = call.getString("gpa", "");
        String unitsPassed = call.getString("unitsPassed", "");
        String termGpa = call.getString("termGpa", "");
        String theme = call.getString("theme", "auto");

        int studyMinutes = call.getInt("studyMinutes", 0) == null ? 0 : call.getInt("studyMinutes", 0);
        int studyStreak = call.getInt("studyStreak", 0) == null ? 0 : call.getInt("studyStreak", 0);
        String studySubject = call.getString("studySubject", "مطالعه و برنامه‌ریزی");

        int tasksDoneCount = call.getInt("tasksDoneCount", 0) == null ? 0 : call.getInt("tasksDoneCount", 0);
        int tasksTotalCount = call.getInt("tasksTotalCount", 0) == null ? 0 : call.getInt("tasksTotalCount", 0);
        String topTaskTitle = call.getString("topTaskTitle", "");
        String secondTaskTitle = call.getString("secondTaskTitle", "");

        SarvestanWidgetProvider.save(ctx, nextTitle, nextTime, nextRoom, examTitle, examDays, examDate, gpa, unitsPassed, termGpa, theme);

        SharedPreferences sp = ctx.getSharedPreferences(SarvestanWidgetProvider.PREFS, Context.MODE_PRIVATE);
        sp.edit()
            .putInt("study_minutes", studyMinutes)
            .putInt("study_streak", studyStreak)
            .putString("study_subject", studySubject)
            .putString("second_exam_title", secondExamTitle)
            .putInt("second_exam_days", secondExamDays)
            .putInt("tasks_done_count", tasksDoneCount)
            .putInt("tasks_total_count", tasksTotalCount)
            .putString("top_task_title", topTaskTitle)
            .putString("second_task_title", secondTaskTitle)
            .apply();

        AppWidgetManager mgr = AppWidgetManager.getInstance(ctx);
        int total = 0;

        // 1. ویجت ترکیبی جامع (۴×۲)
        int[] comboIds = mgr.getAppWidgetIds(new ComponentName(ctx, SarvestanWidgetProvider.class));
        if (comboIds != null && comboIds.length > 0) {
            total += comboIds.length;
            for (int id : comboIds) {
                SarvestanWidgetProvider.updateOne(ctx, mgr, id);
            }
        }

        // 2. ویجت اختصاصی معدل (۲×۲)
        int[] gpaIds = mgr.getAppWidgetIds(new ComponentName(ctx, SarvestanGpaWidgetProvider.class));
        if (gpaIds != null && gpaIds.length > 0) {
            total += gpaIds.length;
            for (int id : gpaIds) {
                SarvestanGpaWidgetProvider.updateOne(ctx, mgr, id);
            }
        }

        // 3. ویجت کلاس بعدی (۲×۲)
        int[] classIds = mgr.getAppWidgetIds(new ComponentName(ctx, SarvestanClassWidgetProvider.class));
        if (classIds != null && classIds.length > 0) {
            total += classIds.length;
            for (int id : classIds) {
                SarvestanClassWidgetProvider.updateOne(ctx, mgr, id);
            }
        }

        // 4. ویجت نواری کلاس بعدی (۴×۱)
        int[] slimClassIds = mgr.getAppWidgetIds(new ComponentName(ctx, SarvestanSlimClassWidgetProvider.class));
        if (slimClassIds != null && slimClassIds.length > 0) {
            total += slimClassIds.length;
            for (int id : slimClassIds) {
                SarvestanSlimClassWidgetProvider.updateOne(ctx, mgr, id);
            }
        }

        // 5. ویجت نواری مطالعه (۴×۱)
        int[] studyIds = mgr.getAppWidgetIds(new ComponentName(ctx, SarvestanStudyWidgetProvider.class));
        if (studyIds != null && studyIds.length > 0) {
            total += studyIds.length;
            for (int id : studyIds) {
                SarvestanStudyWidgetProvider.updateOne(ctx, mgr, id);
            }
        }

        // 6. ویجت نواری روزشمار امتحان (۴×۱)
        int[] slimExamIds = mgr.getAppWidgetIds(new ComponentName(ctx, SarvestanSlimExamWidgetProvider.class));
        if (slimExamIds != null && slimExamIds.length > 0) {
            total += slimExamIds.length;
            for (int id : slimExamIds) {
                SarvestanSlimExamWidgetProvider.updateOne(ctx, mgr, id);
            }
        }

        // 7. ویجت نواری کارهای امروز (۴×۱)
        int[] slimTaskIds = mgr.getAppWidgetIds(new ComponentName(ctx, SarvestanSlimTasksWidgetProvider.class));
        if (slimTaskIds != null && slimTaskIds.length > 0) {
            total += slimTaskIds.length;
            for (int id : slimTaskIds) {
                SarvestanSlimTasksWidgetProvider.updateOne(ctx, mgr, id);
            }
        }

        // 8. ویجت روزشمار امتحانات (۴×۲)
        int[] examIds = mgr.getAppWidgetIds(new ComponentName(ctx, SarvestanExamWidgetProvider.class));
        if (examIds != null && examIds.length > 0) {
            total += examIds.length;
            for (int id : examIds) {
                SarvestanExamWidgetProvider.updateOne(ctx, mgr, id);
            }
        }

        // 9. ویجت کارت کارهای امروز و پلنر (۴×۲)
        int[] taskIds = mgr.getAppWidgetIds(new ComponentName(ctx, SarvestanTasksWidgetProvider.class));
        if (taskIds != null && taskIds.length > 0) {
            total += taskIds.length;
            for (int id : taskIds) {
                SarvestanTasksWidgetProvider.updateOne(ctx, mgr, id);
            }
        }

        // 10. ویجت مینی معدل (۱×۱)
        int[] microIds = mgr.getAppWidgetIds(new ComponentName(ctx, SarvestanMicroWidgetProvider.class));
        if (microIds != null && microIds.length > 0) {
            total += microIds.length;
            for (int id : microIds) {
                SarvestanMicroWidgetProvider.updateOne(ctx, mgr, id);
            }
        }

        // 11. ویجت مینی استریک مطالعه (۱×۱)
        int[] microStreakIds = mgr.getAppWidgetIds(new ComponentName(ctx, SarvestanMicroStreakWidgetProvider.class));
        if (microStreakIds != null && microStreakIds.length > 0) {
            total += microStreakIds.length;
            for (int id : microStreakIds) {
                SarvestanMicroStreakWidgetProvider.updateOne(ctx, mgr, id);
            }
        }

        // 12. ویجت مینی روزشمار امتحان (۱×۱)
        int[] microExamIds = mgr.getAppWidgetIds(new ComponentName(ctx, SarvestanMicroExamWidgetProvider.class));
        if (microExamIds != null && microExamIds.length > 0) {
            total += microExamIds.length;
            for (int id : microExamIds) {
                SarvestanMicroExamWidgetProvider.updateOne(ctx, mgr, id);
            }
        }

        // 13. ویجت مینی ساعت کلاس بعدی (۱×۱)
        int[] microClassIds = mgr.getAppWidgetIds(new ComponentName(ctx, SarvestanMicroClassWidgetProvider.class));
        if (microClassIds != null && microClassIds.length > 0) {
            total += microClassIds.length;
            for (int id : microClassIds) {
                SarvestanMicroClassWidgetProvider.updateOne(ctx, mgr, id);
            }
        }

        JSObject ret = new JSObject();
        ret.put("ok", true);
        ret.put("count", total);
        call.resolve(ret);
    }
}
