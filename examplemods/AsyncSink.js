(function AsyncSinkFn() {
    //AsyncSink is a plugin to debug and override asynchronous methods in EaglercraftX
    function runtimeComponent() {
        const booleanResult = (b) => ModAPI.hooks.methods.nlevit_BooleanResult__new(b * 1);
        const wrap = ModAPI.hooks.methods.otji_JSWrapper_wrap;
        const unwrap = ModAPI.hooks.methods.otji_JSWrapper_unwrap;
        function getAsyncHandlerName(name) {
            var suffix = `$AsyncHandlers_${name}$_asyncCall_$`;
            return ModAPI.hooks._rippedMethodKeys.find(x => x.endsWith(suffix));
        }
        var fs_debugging = false;
        const encoder = new TextEncoder('utf-8');
        var filesystemPlatform = ModAPI.hooks.methods.nlevit_IndexedDBFilesystem$AsyncHandlers_readWholeFile ? true : false;
        if (!filesystemPlatform) {
            console.error("AsyncSink requires EaglercraftX u37 or greater to work! Attempting to run anyway...");
        }
        const AsyncSink = {};
        const originalSuspend = ModAPI.hooks.TeaVMThread.prototype.suspend;
        AsyncSink.startDebugging = function hookIntoSuspend() {
            ModAPI.hooks.TeaVMThread.prototype.suspend = function suspend(...args) {
                console.log("[AsyncSink] Context suspended! Callback: ", args[0]);
                return originalSuspend.apply(this, args);
            }
        }
        AsyncSink.stopDebugging = function unhookFromSuspend() {
            ModAPI.hooks.TeaVMThread.prototype.suspend = originalSuspend;
        }

        AsyncSink.startDebuggingFS = function hookIntoSuspend() {
            fs_debugging = true;
        }
        AsyncSink.stopDebuggingFS = function unhookFromSuspend() {
            fs_debugging = false;
        }

        // @type Map<string, ArrayBuffer>
        AsyncSink.FS = new Map();
        AsyncSink.FSOverride = new Set();
        AsyncSink.setFile = function setFile(path, data) {
            if (typeof data === "string") {
                data = encoder.encode(data).buffer;
            }
            AsyncSink.FSOverride.add(path);
            AsyncSink.FS.set(path, data);
            return true;
        }

        AsyncSink.deleteFile = function deleteFile(path) {
            AsyncSink.FSOverride.delete(path);
            AsyncSink.FS.delete(path);
            return true;
        }

        AsyncSink.getFile = function getFile(path) {
            return AsyncSink.FS.get(path) || new ArrayBuffer(0);
        }

        AsyncSink.fileExists = function fileExists(path) {
            return AsyncSink.FS.has(path);
        }

        var readWholeFileName = getAsyncHandlerName("readWholeFile");
        var writeWholeFileName = getAsyncHandlerName("writeWholeFile");
        var deleteFileName = getAsyncHandlerName("deleteFile");
        var fileExistsName = getAsyncHandlerName("fileExists");

        const originalReadWholeFile = ModAPI.hooks.methods[readWholeFileName];
        ModAPI.hooks.methods[readWholeFileName] = function (...args) {
            if (fs_debugging) {
                console.log("[AsynkSinkFS] File read request sent: " + ModAPI.util.ustr(args[1]));
            }
            if (AsyncSink.FSOverride.has(ModAPI.util.ustr(args[1]))) {
                if (fs_debugging) {
                    console.log("[AsynkSinkFS] Replied with copy from fake filesystem.");
                }
                return wrap(AsyncSink.getFile(ModAPI.util.ustr(args[1])));
            }
            return originalReadWholeFile.apply(this, args);
        };

        const originalWriteWholeFile = ModAPI.hooks.methods[writeWholeFileName];
        ModAPI.hooks.methods[writeWholeFileName] = function (...args) {
            if (fs_debugging) {
                console.log("[AsynkSinkFS] File write request sent: " + ModAPI.util.ustr(args[1]), args[2]);
            }
            if (AsyncSink.FSOverride.has(ModAPI.util.ustr(args[1]))) {
                if (fs_debugging) {
                    console.log("[AsynkSinkFS] Writing to fake filesystem.");
                }
                AsyncSink.setFile(ModAPI.util.ustr(args[1]), args[2]);
                return booleanResult(true);
            }
            return originalWriteWholeFile.apply(this, args);
        };

        const originalDeleteFile = ModAPI.hooks.methods[deleteFileName];
        ModAPI.hooks.methods[deleteFileName] = function (...args) {
            if (fs_debugging) {
                console.log("[AsynkSinkFS] File delete request sent: " + ModAPI.util.ustr(args[1]));
            }
            if (AsyncSink.FSOverride.has(ModAPI.util.ustr(args[1]))) {
                if (fs_debugging) {
                    console.log("[AsynkSinkFS] Deleting entry from fake filesystem.");
                }
                AsyncSink.deleteFile(ModAPI.util.ustr(args[1]));
                return booleanResult(true);
            }
            return originalDeleteFile.apply(this, args);
        };

        const originalFileExists = ModAPI.hooks.methods[fileExistsName];
        ModAPI.hooks.methods[fileExistsName] = function (...args) {
            if (fs_debugging) {
                console.log("[AsynkSinkFS] File exists request sent: " + ModAPI.util.ustr(args[1]));
            }
            if (AsyncSink.FSOverride.has(ModAPI.util.ustr(args[1]))) {
                if (fs_debugging) {
                    console.log("[AsynkSinkFS] Replying with information from fake filesystem.");
                }
                var result = AsyncSink.fileExists(ModAPI.util.ustr(args[1]));
                return booleanResult(result);
            }
            return originalFileExists.apply(this, args);
        };
        globalThis.AsyncSink = AsyncSink;
        ModAPI.events.callEvent("lib:asyncsink", {});
    }
    runtimeComponent();
    ModAPI.dedicatedServer.appendCode(runtimeComponent);
})();