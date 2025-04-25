const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);

  await prisma.comment.deleteMany();
  console.log('Deleted records in comment table');

  await prisma.review.deleteMany();
  console.log('Deleted records in review table');

  await prisma.user.deleteMany();
  console.log('Deleted records in user table');

  await prisma.item.deleteMany();
  console.log('Deleted records in item table');


  const passwordSalt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('password123', passwordSalt); 

  const user1 = await prisma.user.create({
    data: {
      username: 'alice',
      email: 'alice@example.com',
      password: hashedPassword,
    },
  });
  console.log(`Created user with id: ${user1.id}`);

  const user2 = await prisma.user.create({
    data: {
      username: 'bob',
      email: 'bob@example.com',
      password: hashedPassword,
    },
  });
  console.log(`Created user with id: ${user2.id}`);

  const item1 = await prisma.item.create({
    data: {
      name: 'The Cozy Cafe',
      description: 'A warm place for coffee and pastries.',
      category: 'restaurant',
    },
  });
  console.log(`Created item with id: ${item1.id}`);

  const item2 = await prisma.item.create({
    data: {
      name: 'Modern Tech Gadget',
      description: 'The latest and greatest gadget you never knew you needed.',
      category: 'product',
    },
  });
  console.log(`Created item with id: ${item2.id}`);

  const item3 = await prisma.item.create({
    data: {
      name: 'Silent Library',
      description: 'A quiet place to read and study.',
      category: 'place',
    },
  });
   console.log(`Created item with id: ${item3.id}`);


  const review1 = await prisma.review.create({
    data: {
      text: 'Great atmosphere and delicious croissants!',
      rating: 5,
      userId: user1.id, 
      itemId: item1.id, 
    },
  });
  console.log(`Created review with id: ${review1.id}`);

  const review2 = await prisma.review.create({
    data: {
      text: 'Coffee was a bit cold, but the staff was friendly.',
      rating: 3,
      userId: user2.id, 
      itemId: item1.id, 
    },
  });
  console.log(`Created review with id: ${review2.id}`);

   const review3 = await prisma.review.create({
    data: {
      text: 'Works as advertised, very sleek design.',
      rating: 4,
      userId: user1.id, 
      itemId: item2.id, 
    },
  });
  console.log(`Created review with id: ${review3.id}`);


  const comment1 = await prisma.comment.create({
    data: {
      text: 'I agree, the croissants are the best!',
      userId: user2.id, 
      reviewId: review1.id, 
    },
  });
  console.log(`Created comment with id: ${comment1.id}`);

   const comment2 = await prisma.comment.create({
    data: {
      text: 'Maybe give the espresso a try next time?',
      userId: user1.id, 
      reviewId: review2.id, 
    },
  });
  console.log(`Created comment with id: ${comment2.id}`);


  console.log(`Seeding finished.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

