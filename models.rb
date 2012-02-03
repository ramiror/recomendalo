class Page
  include DataMapper::Resource
  property :id,         Serial
  property :title,      String
  property :created_at, DateTime
  property :creator_id, Integer
  property :description,Text
  property :website,    String

  validates_presence_of :title
  validates_presence_of :description
end

class User
  include DataMapper::Resource
  property :id,         Serial
  property :email,      String
  property :password,   String
  property :created_at, DateTime
  property :fullname,   String
  property :fullname,   String
  property :biography,  String
  property :website,    String
  property :username,   String

  validates_presence_of :fullname
  validates_presence_of :username
  validates_presence_of :email
  validates_presence_of :password
  
  validates_confirmation_of :password, :confirm => :repeat_password
  
  validates_uniqueness_of :email
  validates_uniqueness_of :username
  
  attr_accessor :repeat_password

  has n, :recommendations, :throughs => :creator_id
  # estos son intermedios
  has n, :follows, 'Follow', :child_key => [:follower_id]
  has n, :followings, 'Follow', :child_key => [:followed_id]
  # estas son las asociaciones finales, las que vamos a usar en general.
  has n, :followers, self, :through => :follows, :via => :follower
  has n, :followeds, self, :through => :followings, :via => :followed
end

class Recommendation
  include DataMapper::Resource
  property :id,         Serial
  property :creator_id, Integer
  property :user_id,    Integer
  property :created_at, DateTime
  property :state,      Integer
  property :page_id,     Integer

  validates_presence_of :state
  validates_presence_of :user_id
  validates_presence_of :creator_id
  validates_presence_of :page_id

  belongs_to :page
end

class Follow
  include DataMapper::Resource
  property :follower_id,       Integer, :key => true
  property :followed_id,       Integer, :key => true
  
  belongs_to :follower, 'User'
  belongs_to :followed, 'User'
end
