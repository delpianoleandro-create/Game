export class LogManager {
    constructor() {
        this.logs = [];
        this.startTime = Date.now();
        this.overrideConsole();
        
        window.addEventListener('error', (event) => {
            this.addLog(`[ERROR FATAL] ${event.message} en ${event.filename}:${event.lineno}`, 'error');
        });
        window.addEventListener('unhandledrejection', (event) => {
            this.addLog(`[RECHAZO ASYNC] ${event.reason}`, 'error');
        });
    }

    overrideConsole() {
        const originalLog = console.log;
        const originalWarn = console.warn;
        const originalError = console.error;

        console.log = (...args) => {
            originalLog(...args);
            this.addLog(args.join(' '), 'info');
        };

        console.warn = (...args) => {
            originalWarn(...args);
            this.addLog(args.join(' '), 'warn');
        };

        console.error = (...args) => {
            originalError(...args);
            this.addLog(args.join(' '), 'error');
        };
    }

    addLog(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        this.logs.push({ timestamp, message, type });
    }

    getReport() {
        let report = "=== REPORTE DE JUEGO ===\n";
        const playTime = Math.floor((Date.now() - this.startTime) / 1000);
        report += `Tiempo Jugado: ${playTime} segundos\n\n`;
        report += "--- REGISTRO DE EVENTOS ---\n";
        this.logs.forEach(log => {
            report += `[${log.timestamp}] [${log.type.toUpperCase()}] ${log.message}\n`;
        });
        return report;
    }

    downloadReport() {
        const data = this.getReport();
        const blob = new Blob([data], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `elyria_report_${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }
}
