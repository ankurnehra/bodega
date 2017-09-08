class UsersController < ApplicationController
  before_action :authenticate_user!
  before_action :set_user

  def show; end

  def update
    render status: @user.update(user_params) ? :ok : :unprocessable_entity
  end

  private

    def set_user
      @user = current_user
    end

    def user_params
      params.require(:user).permit(:name)
    end
end
