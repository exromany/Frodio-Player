$(function() {

    $.ajaxSetup({
        dataType: 'json',
        url: 'http://api.frodio.com',
    });

    $.ajaxPrefilter(function(options, originalOptions) {
        if (!options.url.match(/^http/)) {
            options.url = $.ajaxSettings.url
                + (options.url.match(/^\//) ? '' : '/') + options.url;
        }
        options.success = function(json, status, xhr) {
            if (json.error) {
                console.log(json.error);
                if (json.error.code == 2) {
                    console.log('надо авторизоваться');
                } else if (json.error.code == 5) {
                    console.log('неправильно задан тип запроса');
                } else {
                    console.log('проверьте параметры запроса');
                }
            }
            originalOptions.success.call(options.context, json, status, xhr);
        }
    });

    window.Station = Backbone.Model.extend({

        defaults: {
            name: 'station',
        },

        ajax: function(params) {
            params.url = '/like';
            params.context = this;
            params.data = {station_id: this.get('id')};
            params.success = function(json) {
                if (json.like) {
                    this.set({like: json.like});
                } else if (json.ok) {
                    //. знак сменён. проверить нужен ли он
                }
            }
            $.ajax(params);
        },

        getLike: function() {
            this.ajax({});
        },

        setLike: function() {
            this.ajax({
                type: 'POST',
            });
        },

        select: function() {
            player.set({current: this.get('id')});
        },

    });

    window.StationList = Backbone.Collection.extend({

        model: Station,

        initialize: function() {
            this.stations();
        },

        stations: function() {
            $.ajax({
                url: '/stations',
                data: 'ext=1',
                context: this,
                success: function(json) {
                    for(var i in json.stations) {
                        var st = this.get(json.stations[i].id)
                        if (!st) {
                            this.add(json.stations[i]);
                        } else {
                            st.set(json.stations[i]);
                        }
                    }
                },
            });
        },

        onair: function() {
            $.ajax({
                url: '/onair',
                context: this,
                success: function(json) {
                    for (var i in json.onair) {
                        var st = this.get(i);
                        if (st) {
                            st.set({onair: json.onair[i]});
                        }// else this.reset();
                    }
                }
            });
        },

    });

    window.UserModel = Backbone.Model.extend({

        // связываем измеение ключа сессии с функцией назначения глобального
        // заголовка сессии
        initialize: function() {
            this.bind('change:session', this.changeHeaders, this);
            this.bind('change:notify', this.changeNotify, this);
            this.fetch();
            this.bind('change', this.save, this);
        },

        changeNotify: function () {
            if (this.previous('notify')) {
                this.notify(this.get('notify'));
            }
        },

        changeHeaders: function() {
            if (this.get('session')) {
                $.ajaxSetup({headers: {'X-Frodio-Auth': this.get('session')}});
            } else {
                delete $.ajaxSettings.headers['X-Frodio-Auth'];
            }
        },

        // общая функция отправки запросов и обработки результатов
        ajax: function(params) {
            params.context = this;
            params.success = function(json) {
                if (json.login) {
                    this.set({ session: json.login.session });
                } else if (json.signup) {
                    // регистрация прошла, что дальше?
                } else if (json.user) {
                    this.set(json.user);
                } else if (json.notify) {
                    // изменение скроблинга прошло на ура
                    // надо изменить this.set({'notify':{}});
                } else if (json.logout) {
                    this.unset('session');
                }
            }
            $.ajax(params);
        },

        login: function(params) {
            this.ajax({
                url: '/login',
                type: 'POST',
                data: params,
            });
        },

        signup: function(params) {
            this.ajax({
                url: '/signup',
                type: 'POST',
                data: params,
            });
        },

        profile: function() {
            this.ajax({
                url: '/profile',
            });
        },

        notify: function(params) {
            this.ajax({
                url: '/profile/notify',
                type: 'POST',
                data: params,
            });
        },

        logout: function() {
            this.ajax({
                url: '/logout',
            });
        },

        save: function() {
            localStorage.setItem('user', JSON.stringify(this.toJSON()));
        },

        fetch: function() {
            var obj = JSON.parse(localStorage.getItem('user'));
            this.clear({silent: true});
            this.set(obj);
        },

    });

    window.PlayerModel = Backbone.Model.extend({

        VIEW_LIST: 0,
        VIEW_TABLE: 1,

        SORT_POPULAR: 0,
        SORT_ABC: 1,
        SORT_ORDER: 2,

        user: new UserModel,
        stations: new StationList,

        defaults: {
            volume: 1,
            paused: true,
            view: this.VIEW_LIST,
            sort: this.SORT_POPULAR,
            notification: false,
            notification_time: 3,
        },

        initialize: function() {
            this.bind('change:current', this.restart, this);
            this.stations.bind('add', this.setDefault, this);
        },

        play: function(restart) {
            if (this.get('paused')) {
                this.set({'paused': false});
                console.log('Played ' + this.current().get('title'));
            }
        },

        stop: function(restart) {
            if (!this.get('paused')) {
                this.set({'paused': true});
                console.log('Stoped');
            }
        },

        restart: function() {
            if (!this.get('paused')) {
                this.stop(true);
                this.play(true);
            }
        },

        volume: function(vol) {
            this.set({volume: vol});
        },

        select: function(id) {
            if (!this.stations.get(id)) return false;
            this.set({current: id});
        },

        random: function() {
            var id = Math.floor(Math.random() * this.stations.length);
            this.set({current: this.stations.models[id]});
        },

        current: function() {
            return this.stations.get(this.get('current'));
        },

        setDefault: function() {
            if (!this.get('current')) {
                this.stations.models[0].select();
            }
        },

        save: function() {
            var obj = this.toJSON();
            delete obj.paused;
            localStorage.setItem('player', JSON.stringify(obj));
            //this.stations.save();
            //this.user.save();
        },

        fetch: function() {
            var obj = JSON.parse(localStorage.getItem('player'));
            // ToDo: очистить текущие данные
            this.clear({silent: true});
            this.set(this.defaults, {silent: true});
            this.set(obj);
        },

    });

    window.player = new PlayerModel;

    window.AppView = Backbone.View.extend({

        el: $('body'),

        fladio: _.template($('#radio').html()),
        //audoio: _.template($('#audio').html()),

        initialize: function() {
            player.bind('change:paused', this.play, this);
            player.bind('change:volume', this.volume, this);
        },

        play: function() {
            if (player.get('paused')) {
                this.el.empty();
            } else {
                this.el.html(this.fladio({
                    volume: player.get('volume'),
                    stream: player.current().get('stream_mp3'),
                }));
            }
        },

        volume: function() {
            player.restart();
        },

    });

    window.app = new AppView;
});
