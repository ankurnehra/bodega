class CreateOrders < ActiveRecord::Migration[5.1]
  def change
    create_table :orders do |t|
      t.belongs_to :supplier,      null: false,
                                   foreign_key: { to_table: :companies }
      t.belongs_to :purchaser,     null: false,
                                   foreign_key: { to_table: :companies }
      t.belongs_to :placed_by,     null: false,
                                   foreign_key: { to_table: :users }
      t.belongs_to :accepted_by,   foreign_key: { to_table: :users }
      t.string     :invoice_no,    null: false
      t.integer    :total
      t.integer    :discount
      t.string     :discount_type
      t.text       :notes

      t.timestamps
    end

    add_index :orders, [:supplier, :invoice_no], unique: true
  end
end
