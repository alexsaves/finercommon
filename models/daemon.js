const colors = require("colors");
const moment = require("moment");
const EventEmitter = require("events");
const redisLock = require("redis-lock");

/**
 * Scheduler for tasks that happen on a timer
 */
class Daemon {
  /**
   * Sets up a new Daemon
   * @param {*} mysql
   * @param {*} redis
   */
  constructor(mysql, redis, cfg) {
    this.connectionPool = mysql;
    this.redis = redis;
    this.lock = redisLock(redis);
    this.cfg = cfg;
    this.tablename = "daemon_history";
    this.tasks = [];
    this.taskhistory = [];
    this.updates = new EventEmitter();
    process.nextTick(() => {
      this._log("started");
      this._clearOldHistory(true, () => {
        this
          .updates
          .emit("ready", this);
        process.nextTick(this._checkTasks.bind(this));
        this._checkTimer = setInterval(this._checkTasks.bind(this), 60 * 1000);
      });
    });
  }

  /**
   * Get Date information for a JavaScript date
   * @param {Date} dt
   */
  _getDateInfo(dt) {
    var mt = moment(dt);
    return {
      year: mt.year(),
      month: mt.month(),
      dayofmonth: mt.date(),
      dayofweek: mt.day()
    };
  }

  /**
   * Check any tasks that need to be executed
   */
  _checkTasks() {
    this.lock("daemonlock", (done) => {
      this._clearOldHistory(false, () => {
        // Dealing with accurate history now
        let nowDate = new Date(),
          nowMoment = moment(nowDate),
          nowInfo = this._getDateInfo(nowDate),
          nowDayOfWeek = nowMoment.day(),
          tsks = this.tasks;

        // For each task, go back and determine the last date it COULD have run on.
        tsks.forEach((tsk) => {
          if (nowDayOfWeek == tsk.dayOfWeek) {
            // Set the ideal date
            let idealDate = moment(nowDate)
              .hour(tsk.hourOfDay)
              .minute(0)
              .second(0)
              .millisecond(0);

            // Now see if that's in the future. If it is, then subtract a week
            if (nowMoment.isAfter(idealDate)) {
              // We have an ideal date now that is in the past Check to see if we already did it
              if (!this._didTaskHappen(tsk.taskName, idealDate)) {
                this._execTask(tsk, idealDate);
              }
            }
          }
        });

        // Release the lock
        done();
      });
    });
  }

  /**
   * Run the task
   * @param {Task} task
   */
  _execTask(tsk, idealwhen) {
    var cfg = this.cfg;

    // Log it out
    this._log("executing task " + tsk.taskName);

    // First update the DB
    this
      .taskhistory
      .push({
        id: 0,
        task_name: tsk.taskName,
        org_id: 0,
        created_at: idealwhen.toDate(),
        updated_at: new Date(),
        when: idealwhen.clone()
      });

    this
      .connectionPool
      .getConnection((err, cn) => {
        if (err) {
          this._err(err.toString());
        } else {
          cn.query("INSERT INTO " + cfg.db.db + '.' + this.tablename + " SET created_at = ?, updated_at = ?, task_name = ?, org_id = ?", [
            idealwhen.toDate(),
            idealwhen.toDate(),
            tsk.taskName,
            0
          ], (err, res) => {
            cn.release();
            this
              .updates
              .emit("task", tsk.taskName);
          });
        }
      });
  }

  /**
   * Did a task take place?
   * @param {String} taskName
   * @param {Moment} when
   */
  _didTaskHappen(taskName, when) {
    var year = when.year(),
      month = when.month(),
      dat = when.date();
    var tevt = this
      .taskhistory
      .find((tk) => {
        return tk.task_name == taskName && tk
          .when
          .year() == year && tk
          .when
          .month() == month && tk
          .when
          .date() == dat;
      });
    return !!tevt;
  }

  /**
   * Format a number
   * @param {*} num
   */
  getDaySuffix(num) {
    var array = ("" + num)
      .split("")
      .reverse(); // E.g. 123 = array("3","2","1")

    if (array[1] != "1") { // Number is in the teens
      switch (array[0]) {
        case "1":
          return "st";
        case "2":
          return "nd";
        case "3":
          return "rd";
      }
    }

    return "th";
  }

  /**
   * Have a task run at the same time every day
   * @param {*} hourOfDay
   * @param {*} taskName
   */
  scheduleDailyTask(hourOfDay, taskName) {
    for (let i = 1; i <= 7; i++) {
      this.scheduleTask(i, hourOfDay, taskName);
    }
  }

  /**
   * Get the name of the day from the number
   * @param {*} daynum
   */
  getDayNameFromNumber(daynum) {
    var dys = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday"
    ];
    if (daynum < 1 || daynum > 7) {
      throw new Error("Invalid day. Valid: 1-7");
    }
    return dys[daynum - 1];
  }

  /**
   * Schedule a task
   * @param {Number} dayOfWeek - 1 is Monday and 7 is Sunday
   * @param {Number} hourOfDay - 0 - 24
   * @param {String} taskName - The name of the task
   */
  scheduleTask(dayOfWeek, hourOfDay, taskName) {
    if (taskName.length > 45) {
      throw new Error("Task name is too long (max length: 45 characters).");
    }
    dayOfWeek = parseInt(dayOfWeek);
    hourOfDay = parseInt(hourOfDay);
    if (isNaN(dayOfWeek) || isNaN(hourOfDay)) {
      throw new Error("Invalid task day or hour: " + dayOfWeek + ", " + hourOfDay);
    }
    if (dayOfWeek < 1 || dayOfWeek > 7) {
      throw new Error("Invalid day of week. Must be 1-7.");
    }
    if (hourOfDay < 0 || hourOfDay > 23) {
      throw new Errro("Invalid hour of day. Must be 0-23.");
    }
    taskName = taskName
      .toUpperCase()
      .trim();
    this
      .tasks
      .push({dayOfWeek: dayOfWeek, hourOfDay: hourOfDay, taskName: taskName});
    this._log("scheduling a \"" + taskName + "\" task for the " + dayOfWeek + this.getDaySuffix(dayOfWeek) + " day of the week (" + this.getDayNameFromNumber(dayOfWeek) + ") at " + hourOfDay + "hrs (24hr) time.");
  }

  /**
   * Log a message
   * @param {*} msg
   */
  _log(msg) {
    console.log("  [DAEMON]".green, msg);
  }

  /**
   * Log an error
   * @param {*} msg
   */
  _err(msg) {
    console.log("  [DAEMON]", "(Error)".red, msg);
  }

  /**
   * Clean up older tasks so they dont slow stuff down
   */
  _clearOldHistory(dologging, cb) {
    var cfg = this.cfg;
    this
      .connectionPool
      .getConnection((err, cn) => {
        if (err) {
          this._err(err.toString());
        } else {
          cn.query("DELETE FROM " + cfg.db.db + '.' + this.tablename + " WHERE created_at < ?", [
            moment()
              .subtract(7, 'day')
              .toDate()
          ], (err, res) => {
            cn.release();
            if (err) {
              this._err(err.toString());
            } else {
              if (dologging) {
                this._log("cleared history older than 7 days");
              }
              this._getHistory(dologging, cb);
            }
          });
        }
      });
  }

  /**
   * Get the latest history
   */
  _getHistory(dologging, cb) {
    var cfg = this.cfg;
    this
      .connectionPool
      .getConnection((err, cn) => {
        if (err) {
          this._err(err.toString());
        } else {
          cn.query("SELECT * FROM " + cfg.db.db + '.' + this.tablename + " ORDER BY created_at DESC", (err, res) => {
            cn.release();
            if (err) {
              this._err(err.toString());
            } else {
              this.taskhistory = res;
              res.forEach((tk) => {
                tk.when = moment(tk.created_at);
              });
              if (dologging) {
                this._log("retrieved " + res.length + " history items");
              }
              if (cb) {
                process.nextTick(cb);
              }
            }
          });
        }
      });
  }
}

module.exports = Daemon;