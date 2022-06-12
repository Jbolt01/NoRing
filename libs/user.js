const getDateStr = timestamp => {
  return new Date(timestamp).toISOString().split("T")[0];
};

const isDiagnosticExpired = timestamp => {
  if (!timestamp || typeof timestamp !== "number") return false;
  const DIAGNOSTIC_EXPIRATION = 7 * 24 * 60 * 60 * 1000;
  return timestamp < Date.now() - DIAGNOSTIC_EXPIRATION;
};

export default class User {
  constructor() {
    throw new Error("Use init() and getInstance() instead.");
  }

  static init() {
    this.initUserId();
    this.purgeOldSessions();
  }

  static getInstance() {
    if (!this.instance) {
      this.instance = this;
      this.init();
    }
    return this.instance;
  }

  static getUser() {
    let user = null;
    try {
      user = JSON.parse(window.localStorage.getItem("user"));
    } catch (e) {
      user = null;
    }

    return null;
  }

  static saveUser(data) {
    try {
      if (typeof data === "undefined")
        throw new Error("You haven't provided user data");
      window.localStorage.setItem("user", JSON.stringify(data));
    } catch (e) {}
  }

  static getTodaySessions() {
    const sessions = this.getSessions();
    const todayStr = getDateStr(Date.now());
    return sessions.filter(s => getDateStr(s.startAt) === todayStr, 0);
  }

  static getTodayDuration() {
    const sessions = this.getTodaySessions();
    return sessions.reduce((a, s) => a + s.duration, 0);
  }

  static getSessionDurationsByDay(startAt, endAt) {
    const sessions = this.getSessions();
    const days = [];
    const startDate = new Date(startAt);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(endAt);
    endDate.setHours(23, 59, 59, 59);

    for (
      let datePtr = new Date(startDate);
      datePtr < endDate;
      datePtr.setDate(datePtr.getDate() + 1)
    ) {
      const todayStr = getDateStr(datePtr);
      const seconds = sessions
        .filter(s => getDateStr(s.startAt) === todayStr, 0)
        .reduce((a, s) => a + s.duration, 0);
      days.push({
        date: getDateStr(datePtr),
        day: datePtr.getDay(),
        duration: seconds
      });
    }

    return days;
  }

  static getSessions() {
    let sessions = [];
    try {
      sessions = JSON.parse(window.localStorage.getItem("sessions"));
      if (!Array.isArray(sessions)) {
        throw new Error("Session data is corrupted");
      }
    } catch (e) {
      sessions = [];
    }

    return sessions;
  }

  static saveSessions(sessions) {
    try {
      if (typeof sessions === "undefined")
        throw new Error("You haven't provided a list of sessions");
      window.localStorage.setItem("sessions", JSON.stringify(sessions));
    } catch (e) {}
  }

  static addSession(frequency, startAt, endAt) {
    if (!startAt || !endAt || endAt - startAt <= 1000) return;
    if (isNaN(parseInt(frequency))) throw Error("That's not a frequency");

    const sessions = this.getSessions();
    sessions.push({
      frequency: parseInt(frequency),
      startAt,
      endAt,
      duration: Math.floor((endAt - startAt) / 1000)
    });
    this.saveSessions(sessions);
  }

  static purgeOldSessions() {
    const sessions = this.getSessions();
    // Just keep the 30 days or so
    const clipTimestamp = Date.now() - 31 * 24 * 60 * 60 * 1000;
    const recentSessions = sessions.filter(s => s.startAt >= clipTimestamp);
    this.saveSessions(recentSessions);
  }

  static purgeSessions() {
    this.saveSessions([]);
  }

  static getUserId() {
    if (!this.deviceId) throw new Error("User class not initialized");
    return this.deviceId;
  }

  static initUserId() {
    try {
      this.deviceId = window.localStorage.getItem("deviceId") || uuidv4();
      window.localStorage.setItem("deviceId", this.deviceId);

      this.initTrackers();
    } catch (e) {}
  }

  static initTrackers() {
    return;
  }

  static getDidTutorial() {
    try {
      return !!window.localStorage.getItem("didTutorial");
    } catch (e) {
      return false;
    }
  }

  static setDidTutorial() {
    return window.localStorage.setItem("didTutorial", `${Date.now()}`);
  }

  static getDiagnotics() {
    let diagnostics = [];
    try {
      diagnostics = JSON.parse(window.localStorage.getItem("diagnostics"));
      if (!Array.isArray(diagnostics)) {
        throw new Error("Session data is corrupted");
      }
    } catch (e) {
      diagnostics = [];
    }

    return diagnostics;
  }

  static saveDiagnostics(diagnostics) {
    try {
      if (typeof diagnostics === "undefined")
        throw new Error("You haven't provided a list of diagnostics");
      window.localStorage.setItem("diagnostics", JSON.stringify(diagnostics));
    } catch (e) {}
  }

  static hasOldDiagnostic() {
    const lastDiagnostic = this.getLastDiagnostic();
    if (!lastDiagnostic) return true;
    return isDiagnosticExpired(lastDiagnostic.createdAt);
  }

  static getLastDiagnostic() {
    const allDiagnostics = this.getDiagnotics();
    return allDiagnostics.pop();
  }

  static addDiagnostic(frequency) {
    if (isNaN(parseInt(frequency))) throw Error("That's not a frequency");
    const diagnostics = this.getDiagnotics();
    diagnostics.push({
      frequency: parseInt(frequency),
      createdAt: Date.now()
    });
    this.saveDiagnostics(diagnostics);
  }

  static setFrequency(freq) {
    try {
      return window.localStorage.setItem("frequency", `${freq}`);
    } catch (e) {}
  }

  static getFrequency() {
    try {
      return window.localStorage.getItem("frequency") || null;
    } catch (e) {
      return null;
    }
  }

  static getVolume() {
    try {
      return parseFloat(window.localStorage.getItem("volume"));
    } catch (e) {
      return null;
    }
  }

  static setVolume(volume) {
    try {
      window.localStorage.setItem("volume", volume);
    } catch (e) {}
  }

  static isProduction() {
    // TODO: Implement this based on domain or whatever.
    return true;
  }

  static trackEventGA(category, action, label, value) {
    return;
  }

  static trackEventMixpanel(action) {
    return;
  }

  static addUserDataMixpanel(data) {
    return;
  }

  static trackSessionStart(frequency) {
    return;
  }

  static trackSessionStop(frequency, seconds) {
    return;
  }

  /**
   * Track when a user surpasses the 3-hour treatment mark
   */
  static trackSessionSuccess(frequency, seconds) {
    return;
  }

  static trackDiagnosticStep(step, seconds) {
    return;
  }
}

function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
    var r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
