namespace app.ui {
    const CLASS_FAIL = 'fail';
    const CLASS_DONE = 'done';
    const CLASS_FRESH = 'fresh';

    var dialogSyncDef = app.ui.dialog(app.grabSample('.dialog_task_runner'));

    class TaskRunner {
        opt: any;
        stop = false;
        dialog: app.ui.Dialog;
        btnStop: HTMLButtonElement;
        btnClose: HTMLButtonElement;
        tasksTable: app.ui.Table<any>;
        reset() {
            this.stop = false;
            app.show(this.btnStop);
        };

        /**
         * Bersihkan semua task
         */
        clear() {
            this.tasksTable.empty();
        }

        /**
         * Tambahkan task
         * @param taskName 
         * @param taskData 
         */
        add(taskName: string, taskData: any) {
            this.tasksTable.addRow({
                name: taskName,
                data: taskData
            });
        };

        /**
         * Mulai jalankan task
         * @param startCount 
         */
        start(startCount: number) {
            var _ = this;
            function runTask(rowElm) {
                app.remClass(rowElm, CLASS_FRESH);
                var statusElm = app.s(rowElm, '.v-status');

                statusElm.innerHTML = "memproses...";
                _.opt.run(rowElm.taskData, function (status) {
                    statusElm.innerHTML = status;
                    app.setClass(rowElm, CLASS_DONE);
                    nextTask(1);
                }, function (e) {
                    statusElm.innerHTML = 'Gagal.' + ((e.responseJSON && e.responseJSON.error) || e.responseText);
                    app.setClass(rowElm, CLASS_FAIL);
                    if (!_.opt.stopOnFail) {
                        nextTask(1);
                    }
                });
            }

            function nextTask(count) {
                if (_.stop) return;
                var tasks = app.sa(_.dialog.contentElm, '.' + CLASS_FRESH);
                if (!tasks.length) {
                    //no more
                    _.stop = true;
                    app.hide(_.btnStop);
                    app.show(_.btnClose);
                    app.ui.notif('Sinkronisasi selesai');
                } else {
                    count = Math.min(count, tasks.length);
                    for (var i = 0; i < count; i++) {
                        if (app.hasClass(tasks[i], CLASS_FRESH)) { //reconfirm
                            runTask(tasks[i]);
                        }
                    }
                }
            }

            _.dialog.show();
            nextTask(startCount);
            console.log('start');
        };
        constructor(option) {
            var _ = this;
            _.opt = option;

            _.dialog = dialogSyncDef.create(null, true);
            _.tasksTable = app.ui.table(app.s(_.dialog.contentElm, '.table_tasks'), {
                setRow: function (rowElm, data) {
                    app.s(rowElm, '.v-task').innerHTML = data.name;
                    app.s(rowElm, '.v-status').innerHTML = data.status || '';

                    (<any>rowElm).taskData = data.data;
                }
            });

            //set title
            _.dialog.title(option.title || '');
            //syncing control
            _.btnStop = <HTMLButtonElement>app.s(_.dialog.contentElm, '[btn=stop]');
            _.btnClose = <HTMLButtonElement>app.s(_.dialog.contentElm, '[btn=close]');
            app.click(_.btnStop, function () {
                _.stop = true;
                app.hide(_.btnStop);
                app.show(_.btnClose);
                app.ui.notif('Sinkronisasi dihentikan');
            }, true);

            app.click(_.btnClose, function () {
                _.stop = true;
                app.hide(_.btnClose);
                _.dialog.close();
            }, true);

            _.dialog.onclosing = function (fromUser, close) {
                if (fromUser) {
                    _.stop = true;
                    app.hide(_.btnClose);
                    app.show(_.btnStop);
                }

                //clear content to save space
                _.tasksTable.empty();

                close();
            };

            _.stop = false;
        }
    }

    export function taskRunner(option) {
        return new TaskRunner(option);
    }
}