$(function() {

    window.StationView = Backbone.View.extend({

        template: _.template($('#station_template').html()),

        render: function() {
            $(this.el).html(this.template(this.model.toJSON()));
            return this;
        },

    });

    window.AppView = Backbone.View.extend({

        el: $('body'),

        t_body: $('#body_template').html(),
        t_player: $('#player_template').html(),
        t_player_content: $('player_content_template').html(),
        t_options: $('options_template').html(),

        player: chrome.extension.getBackgroundPage().player,

        initialize: function() {
            this.el.html(_.template(this.t_body, {}));
        },

        renderStations: function() {
        },

    });

    window.app = new AppView;

});
