$(function() {

    window.StationView = Backbone.View.extend({

        template: _.template($('#station_template').html()),

        className: 'item',

        initialize: function() {
            this.model.bind('change', this.render, this);
            this.model.bind('remove', this.remove, this);
            this.model.track.bind('change', this.changeTrack, this);
            //this.model.bind('change', this.rerender, this);
        },

        render: function() {
            $(this.el).html(this.template(this.model.toJSON()));
            this.renderTrack();
            return this.el;
        },

        changeTrack: function() {
            this.renderTrack();
            app.resizeScroll();
        },

        renderTrack: function() {
            var track = '';
            if (this.model.track.get('track')) {
                track = this.model.track.get('artist').name + ' - ' +
                    this.model.track.get('track').title;
            }
            $(this.el).children('.track').text(track);
        },

        remove: function() {
            console.log('removed');
            $(this.el).remove();
        },

    });

    window.AppView = Backbone.View.extend({

        el: $('body'),

        t_body: $('#body_template').html(),
        t_player: $('#player_template').html(),
        t_player_content: $('player_content_template').html(),
        t_options: $('options_template').html(),

        initialize: function() {
            this.player = chrome.extension.getBackgroundPage().player;
            this.player.stations.onair();
            this.el.html(_.template(this.t_body, {}));
            this.bindScroll();
            this.renderAll();
            this.player.stations.bind('add', this.renderOne, this);
        },

        bindScroll: function() {
            $('#scroll').scroll(function() {
                $('#stations_wrapper').scrollTop($(this).scrollTop());
            });
            $('#stations_wrapper').scroll(function() {
                $('#scroll').scrollTop($(this).scrollTop());
            });
        },

        resizeScroll: function(lol) {
            console.log('resize scroll');
            if (lol) console.log(lol);
            $('#scroll_inner').height(
                $('#stations_wrapper')[0].scrollHeight + 2 + 'px'
            );
        },

        renderAll: function() {
            this.player.stations.each(this.renderOne);
            this.resizeScroll();
        },

        renderOne: function(st) {
            var view = new StationView({model: st});
            this.$('#stations_wrapper').append(view.render());
        },

    });

    window.app = new AppView;

});
