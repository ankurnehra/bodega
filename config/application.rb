require_relative 'boot'

require 'rails/all'

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

module Bodega
  class Application < Rails::Application
    # Initialize configuration defaults for originally generated Rails version.
    config.load_defaults 5.1

    # Settings in config/environments/* take precedence over those specified here.
    # Application configuration should go into files in config/initializers
    # -- all .rb files in that directory are automatically loaded.

    config.generators do |g|
      g.test_framework :rspec, controller_specs: false
    end

    # Autoload parameter helper classes
    # http://guides.rubyonrails.org/autoloading_and_reloading_constants.html
    config.autoload_paths << "#{Rails.root}/app/controllers/parameters"
  end
end
